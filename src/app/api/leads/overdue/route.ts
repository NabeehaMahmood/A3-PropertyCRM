import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, Role } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const query: Record<string, unknown> = {
      $or: [
        { followUpDate: { $lt: now } },
        { lastActivityAt: { $lt: sevenDaysAgo }, status: { $nin: ['closed-won', 'closed-lost'] } },
      ],
    };

    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }

    const overdueLeads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ followUpDate: 1 });

    const overdue = overdueLeads.filter((lead) => !['closed-won', 'closed-lost'].includes(lead.status));
    const stale = overdueLeads.filter((lead) => !lead.followUpDate || new Date(lead.lastActivityAt || 0) < sevenDaysAgo);

    return NextResponse.json({ overdue, stale });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}