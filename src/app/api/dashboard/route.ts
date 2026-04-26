import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, Role } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let leadQuery = {};
    if (!canViewAll(user.role as Role)) {
      leadQuery = { assignedTo: user.userId };
    }

    const [totalLeads, highPriority, mediumPriority, lowPriority, byStatus] = await Promise.all([
      Lead.countDocuments(leadQuery),
      Lead.countDocuments({ ...leadQuery, score: 'high' }),
      Lead.countDocuments({ ...leadQuery, score: 'medium' }),
      Lead.countDocuments({ ...leadQuery, score: 'low' }),
      Lead.aggregate([
        { $match: leadQuery as Record<string, unknown> },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusBreakdown = byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const totalAgents = await User.countDocuments({ role: 'agent' });

    return NextResponse.json({
      stats: {
        totalLeads,
        highPriority,
        mediumPriority,
        lowPriority,
        statusBreakdown,
        totalAgents,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}