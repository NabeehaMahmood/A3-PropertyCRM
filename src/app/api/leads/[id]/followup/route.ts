import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, canUpdateLead, Role } from '@/lib/rbac';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canUpdateLead(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden: Agents cannot schedule follow-ups' }, { status: 403 });
    }

    const { id } = await params;
    const { followUpDate, outcome, notes } = await request.json();

    await connectToDatabase();

    const query: Record<string, unknown> = { _id: id };
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (followUpDate) {
      const newFollowUp = {
        scheduledDate: new Date(followUpDate),
        outcome: 'pending',
        createdBy: user.userId,
        notes: notes || '',
      };

      lead.followUpHistory.push(newFollowUp);
      lead.followUpDate = new Date(followUpDate);
      
      await lead.save();

      await logActivity(
        id,
        user.userId,
        'followup_set',
        `Follow-up scheduled for ${followUpDate}`
      );

      return NextResponse.json({ 
        message: 'Follow-up scheduled', 
        lead: {
          ...lead.toObject(),
          followUpDate: lead.followUpDate?.toISOString(),
          followUpHistory: lead.followUpHistory.map((f: any) => ({
            ...f.toObject(),
            scheduledDate: f.scheduledDate?.toISOString(),
            completedDate: f.completedDate?.toISOString(),
          })),
        }
      });
    }

    return NextResponse.json({ error: 'Follow-up date required' }, { status: 400 });
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canUpdateLead(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden: Agents cannot update follow-ups' }, { status: 403 });
    }

    const { id } = await params;
    const { outcome, notes, historyIndex } = await request.json();

    if (outcome === undefined || historyIndex === undefined) {
      return NextResponse.json({ error: 'Outcome and history index required' }, { status: 400 });
    }

    await connectToDatabase();

    const query: Record<string, unknown> = { _id: id };
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const followUp = lead.followUpHistory[historyIndex];
    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    followUp.outcome = outcome;
    followUp.completedDate = new Date();
    if (notes) {
      followUp.notes = notes;
    }

    let activityDescription = '';
    switch (outcome) {
      case 'completed':
        activityDescription = 'Follow-up completed - Lead showed up';
        break;
      case 'no_show':
        activityDescription = 'Follow-up marked as no-show';
        break;
      case 'rescheduled':
        activityDescription = 'Follow-up rescheduled';
        break;
      default:
        activityDescription = `Follow-up outcome updated: ${outcome}`;
    }

    await lead.save();
    await logActivity(id, user.userId, 'followup_completed', activityDescription);

    return NextResponse.json({ 
      message: 'Follow-up updated',
      lead: {
        ...lead.toObject(),
        followUpDate: lead.followUpDate?.toISOString(),
        followUpHistory: lead.followUpHistory.map((f: any) => ({
          ...f.toObject(),
          scheduledDate: f.scheduledDate?.toISOString(),
          completedDate: f.completedDate?.toISOString(),
        })),
      }
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}