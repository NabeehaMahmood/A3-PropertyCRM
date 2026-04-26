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

    let baseQuery: Record<string, unknown> = {};
    if (!canViewAll(user.role as Role)) {
      baseQuery.assignedTo = user.userId;
    }

    const closedStatuses = ['closed-won', 'closed-lost'];

    // Find overdue leads (follow-up date in the past, not closed)
    const overdueQuery = {
      ...baseQuery,
      followUpDate: { $lt: now },
      status: { $nin: closedStatuses },
    };
    const overdueRaw = await Lead.find(overdueQuery)
      .populate('assignedTo', 'name email')
      .sort({ followUpDate: 1 });
    
    const overdue = overdueRaw.map(lead => ({
      ...lead.toObject(),
      followUpDate: lead.followUpDate?.toISOString(),
      lastActivityAt: lead.lastActivityAt?.toISOString(),
    }));

    // Find stale leads (no activity for 7+ days, not closed)
    const staleQuery = {
      ...baseQuery,
      lastActivityAt: { $lt: sevenDaysAgo },
      status: { $nin: closedStatuses },
    };
    const staleRaw = await Lead.find(staleQuery)
      .populate('assignedTo', 'name email')
      .sort({ lastActivityAt: 1 });
    
    const stale = staleRaw.map(lead => ({
      ...lead.toObject(),
      followUpDate: lead.followUpDate?.toISOString(),
      lastActivityAt: lead.lastActivityAt?.toISOString(),
    }));

    return NextResponse.json({ overdue, stale });
  } catch (error) {
    console.error('Error fetching overdue leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}