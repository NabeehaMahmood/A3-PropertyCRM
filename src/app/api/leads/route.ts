import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, Role } from '@/lib/rbac';
import { sendNewLeadNotification } from '@/lib/email';

function calculateScore(budget: string): 'high' | 'medium' | 'low' {
  const budgetNumber = parseInt(budget.replace(/[^0-9]/g, '')) || 0;
  if (budgetNumber > 20000000) return 'high';
  if (budgetNumber >= 10000000) return 'medium';
  return 'low';
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let query = {};
    if (!canViewAll(user.role as Role)) {
      query = { assignedTo: user.userId };
    }

    const leads = await Lead.find(query).populate('assignedTo', 'name email').sort({ createdAt: -1 });
    return NextResponse.json({ leads });
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

    const { name, email, phone, propertyInterest, budget, notes } = await request.json();

    if (!name || !email || !phone || !propertyInterest || !budget) {
      return NextResponse.json(
        { error: 'Name, email, phone, property interest and budget are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const score = calculateScore(budget);

    const lead = await Lead.create({
      name,
      email,
      phone,
      propertyInterest,
      budget,
      notes: notes || '',
      assignedTo: user.userId,
      score,
    });

    await lead.populate('assignedTo', 'name email');

    sendNewLeadNotification({
      leadName: name,
      leadEmail: email,
      leadPhone: phone,
      propertyInterest,
      budget,
      agentName: (lead.assignedTo as unknown as { name: string }).name,
    }).catch(console.error);

    return NextResponse.json({ message: 'Lead created', lead });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}