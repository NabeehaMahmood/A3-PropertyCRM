import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, canAssign, canUpdateLead, canDeleteLead, Role } from '@/lib/rbac';
import { logActivity } from '@/lib/activity';

function calculateScore(budget: string, propertyInterest: string = ''): 'high' | 'medium' | 'low' {
  const budgetNumber = parseInt(budget.replace(/[^0-9]/g, '')) || 0;
  if (budgetNumber >= 50000000) return 'high';
  if (budgetNumber >= 20000000) return 'medium';
  if (budgetNumber >= 10000000) return 'medium';
  const propertyLower = propertyInterest.toLowerCase();
  if (propertyLower.includes('villa') || propertyLower.includes('penthouse') || propertyLower.includes('luxury')) return 'high';
  return 'low';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const query: Record<string, unknown> = { _id: id };
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query)
      .populate('assignedTo', 'name email')
      .populate('followUpHistory.createdBy', 'name');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const leadResponse = {
      ...lead.toObject(),
      followUpDate: lead.followUpDate?.toISOString(),
      lastActivityAt: lead.lastActivityAt?.toISOString(),
      followUpHistory: lead.followUpHistory.map((f: any) => ({
        ...f.toObject(),
        scheduledDate: f.scheduledDate?.toISOString(),
        completedDate: f.completedDate?.toISOString(),
      })),
    };

    return NextResponse.json({ lead: leadResponse });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canUpdateLead(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden: Agents cannot update leads' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const query: Record<string, unknown> = { _id: id };
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const changes: string[] = [];
    if (body.budget && body.budget !== lead.budget) {
      changes.push('budget');
    }
    if (body.status && body.status !== lead.status) {
      changes.push(`status: ${lead.status} → ${body.status}`);
      await logActivity(
        id,
        user.userId,
        'status_updated',
        `Status changed from ${lead.status} to ${body.status}`
      );
    }
    if (body.notes && body.notes !== lead.notes) {
      changes.push('notes');
      await logActivity(id, user.userId, 'notes_updated', 'Notes updated');
    }

    if (body.budget) {
      const newScore = calculateScore(body.budget, lead.propertyInterest);
      body.score = newScore;
    }

    if (body.followUpDate) {
      if (!lead.followUpDate) {
        await logActivity(id, user.userId, 'followup_set', `Follow-up date set for ${body.followUpDate}`);
      } else if (body.followUpDate !== lead.followUpDate.toISOString().split('T')[0]) {
        await logActivity(id, user.userId, 'followup_set', `Follow-up date changed to ${body.followUpDate}`);
      }
    }

    const previousAssignedTo = lead.assignedTo.toString();
    if (body.assignedTo && body.assignedTo !== previousAssignedTo) {
      await logActivity(
        id,
        user.userId,
        'assigned',
        `Lead reassigned to agent`
      );
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true }).populate('assignedTo', 'name email');

    if (changes.length > 0) {
      await logActivity(
        id,
        user.userId,
        'updated',
        `Fields updated: ${changes.join(', ')}`
      );
    }

    return NextResponse.json({ message: 'Lead updated', lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    const lead = await Lead.findById(id);
    if (lead) {
      await logActivity(id, user.userId, 'deleted', `Lead deleted: ${lead.name}`);
    }

    await Lead.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Lead deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}