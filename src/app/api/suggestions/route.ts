import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { Role } from '@/lib/rbac';

interface Suggestion {
  leadId: string;
  leadName: string;
  reason: string;
  priority: number;
  action: string;
}

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const query: Record<string, unknown> = user.role === 'admin' || user.role === 'manager' 
      ? {} 
      : { assignedTo: user.userId };

    const leads = await Lead.find(query).populate('assignedTo', 'name email');

    const suggestions: Suggestion[] = [];
    const now = new Date();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    for (const lead of leads) {
      let priority = 0;
      let reason = '';
      let action = '';

      const daysSinceCreated = now.getTime() - new Date(lead.createdAt).getTime();
      const daysSinceUpdate = lead.lastActivityAt 
        ? now.getTime() - new Date(lead.lastActivityAt).getTime() 
        : daysSinceCreated;

      if (lead.score === 'high' && lead.status !== 'closed-won' && lead.status !== 'closed-lost') {
        priority += 30;
        reason += 'High priority lead ';
      }

      if (lead.followUpDate) {
        const followUpDays = now.getTime() - new Date(lead.followUpDate).getTime();
        if (followUpDays > 0 && lead.status !== 'closed-won' && lead.status !== 'closed-lost') {
          priority += 40;
          reason += 'Overdue follow-up ';
          action = `Call ${lead.name} immediately about follow-up`;
        } else if (followUpDays < 0 && followUpDays > -86400000) {
          priority += 20;
          action = `Follow up with ${lead.name} today`;
        }
      }

      if (lead.status === 'new' && daysSinceCreated > 3 * 86400000) {
        priority += 25;
        reason += 'New lead not contacted ';
        action = `Contact ${lead.name} - new lead not contacted`;
      }

      if (lead.status === 'negotiation' && daysSinceUpdate > 5 * 86400000) {
        priority += 25;
        reason += 'Negotiation stale ';
        action = `Update status or re-engage ${lead.name}`;
      }

      if (daysSinceUpdate > 7 * 86400000 && lead.status !== 'closed-won' && lead.status !== 'closed-lost') {
        priority += 15;
        reason += 'No activity 7+ days ';
        action = `Check in with ${lead.name}`;
      }

      if (priority > 0) {
        suggestions.push({
          leadId: lead._id.toString(),
          leadName: lead.name,
          reason,
          priority,
          action,
        });
      }
    }

    suggestions.sort((a, b) => b.priority - a.priority);

    return NextResponse.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}