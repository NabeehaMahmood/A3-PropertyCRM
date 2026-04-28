import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, canAssign, canCreateLead, Role } from '@/lib/rbac';
import { sendNewLeadNotification, sendLeadAssignmentNotification } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export function calculateScore(budget: number): 'high' | 'medium' | 'low' {
  // As per requirements:
  // Budget > 20M → High Priority
  // Budget 10M–20M → Medium Priority
  // Budget < 10M → Low Priority
  if (budget >= 20000000) return 'high';
  if (budget >= 10000000) return 'medium';
  return 'low';
}

async function autoAssignLead(): Promise<string | null> {
  const agents = await User.find({ role: 'agent' }).sort({ name: 1 });
  if (agents.length === 0) return null;
  
  const leadCounts = await Promise.all(
    agents.map(async (agent) => ({
      agentId: agent._id.toString(),
      count: await Lead.countDocuments({ 
        assignedTo: agent._id, 
        status: { $nin: ['closed-won', 'closed-lost'] } 
      }),
    }))
  );
  
  const minCount = Math.min(...leadCounts.map((l) => l.count));
  const leastLoaded = leadCounts.find((l) => l.count === minCount);
  
  return leastLoaded?.agentId || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimitResponse = rateLimitMiddleware(request, user.role);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const minBudget = searchParams.get('minBudget');
    const maxBudget = searchParams.get('maxBudget');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectToDatabase();

    let query: Record<string, unknown> = {};
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }
    if (status) query.status = status;
    if (priority) query.score = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { propertyInterest: { $regex: search, $options: 'i' } },
      ];
    }
    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) {
        (query.budget as Record<string, number>).$gte = parseInt(minBudget);
      }
      if (maxBudget) {
        (query.budget as Record<string, number>).$lte = parseInt(maxBudget);
      }
    }

    const skip = (page - 1) * limit;
    const [leads, total] = await Promise.all([
      Lead.find(query).populate('assignedTo', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lead.countDocuments(query),
    ]);

    // Transform leads to include followUpDate
    const leadsWithFollowUp = leads.map(lead => ({
      ...lead.toObject(),
      followUpDate: lead.followUpDate?.toISOString(),
      lastActivityAt: lead.lastActivityAt?.toISOString(),
    }));

    return NextResponse.json({ leads: leadsWithFollowUp, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    const rateLimitResponse = rateLimitMiddleware(request, user.role);
    if (rateLimitResponse) return rateLimitResponse;

    if (!canCreateLead(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden: Agents cannot create leads' }, { status: 403 });
    }

    const { name, email, phone, propertyInterest, budget, notes, source, followUpDate, assignedTo } = await request.json();

    if (!name || !email || !phone || !propertyInterest || !budget) {
      return NextResponse.json(
        { error: 'Name, email, phone, property interest and budget are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const budgetNumber = typeof budget === 'string' ? parseInt(budget.replace(/[^0-9]/g, '')) || 0 : budget;
    const score = calculateScore(budgetNumber);
    
    let assignedToId = user.userId;
    if (canAssign(user.role as Role)) {
      if (assignedTo) {
        assignedToId = assignedTo;
      } else {
        const agentId = await autoAssignLead();
        if (agentId) assignedToId = agentId;
      }
    }

    // Use provided followUpDate or calculate based on priority
    let leadFollowUpDate: Date;
    if (followUpDate) {
      leadFollowUpDate = new Date(followUpDate);
    } else {
      leadFollowUpDate = new Date();
      leadFollowUpDate.setDate(leadFollowUpDate.getDate() + (score === 'high' ? 1 : score === 'medium' ? 3 : 7));
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      propertyInterest,
      budget: budgetNumber,
      notes: notes || '',
      source: source || 'other',
      assignedTo: assignedToId,
      score,
      followUpDate: leadFollowUpDate,
      status: 'new',
    });

    await lead.populate('assignedTo', 'name email');

    await logActivity(
      lead._id.toString(),
      user.userId,
      'created',
      `Lead created with ${score} priority score`
    );

    sendNewLeadNotification({
      leadName: name,
      leadEmail: email,
      leadPhone: phone,
      propertyInterest,
      budget: budgetNumber.toString(),
      agentName: (lead.assignedTo as unknown as { name: string })?.name,
    }).catch((err) => console.error('Failed to send new lead email:', err));

    if (lead.assignedTo) {
      sendLeadAssignmentNotification({
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        propertyInterest,
        budget: budgetNumber.toString(),
        agentName: (lead.assignedTo as unknown as { name: string })?.name,
      }).catch((err) => console.error('Failed to send assignment email:', err));
    }

    return NextResponse.json({ message: 'Lead created', lead }, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
