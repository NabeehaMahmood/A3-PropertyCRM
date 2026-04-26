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

    const now = new Date();
    const activeStatuses = { $nin: ['closed-won', 'closed-lost'] };
    
    const [totalLeads, highPriority, mediumPriority, lowPriority, overdueLeads, staleLeads, byStatus, bySource, agentStats] = await Promise.all([
      Lead.countDocuments(leadQuery),
      Lead.countDocuments({ ...leadQuery, score: 'high' }),
      Lead.countDocuments({ ...leadQuery, score: 'medium' }),
      Lead.countDocuments({ ...leadQuery, score: 'low' }),
      Lead.countDocuments({ 
        ...leadQuery, 
        followUpDate: { $lt: now },
        status: activeStatuses 
      }),
      Lead.countDocuments({
        ...leadQuery,
        lastActivityAt: { $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        status: activeStatuses,
      }),
      Lead.aggregate([
        { $match: leadQuery as Record<string, unknown> },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: leadQuery as Record<string, unknown> },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      canViewAll(user.role as Role)
        ? Lead.aggregate([
            { $match: { assignedTo: { $ne: null } } },
            {
              $group: {
                _id: '$assignedTo',
                totalLeads: { $sum: 1 },
                closedWon: { $sum: { $cond: [{ $eq: ['$status', 'closed-won'] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ['$status', 'negotiation'] }, 1, 0] } },
              },
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agent' } },
            { $unwind: '$agent' },
            { $project: { agentName: '$agent.name', totalLeads: 1, closedWon: 1, inProgress: 1 } },
          ])
        : Promise.resolve([]),
    ]);

    const statusBreakdown = byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const sourceBreakdown = bySource.reduce((acc, item) => {
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
        overdueLeads,
        staleLeads,
        statusBreakdown,
        sourceBreakdown,
        totalAgents,
      },
      agentPerformance: agentStats,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}