import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Activity } from '@/models/Activity';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, Role } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectToDatabase();

    let query: Record<string, unknown> = {};

    if (leadId) {
      query.leadId = leadId;
    }

    if (!canViewAll(user.role as Role)) {
      const userLeads = await Lead.find({ assignedTo: user.userId }).select('_id');
      const userLeadIds = userLeads.map(l => l._id);
      query.leadId = { $in: userLeadIds };
    }

    const skip = (page - 1) * limit;
    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('leadId', 'name email propertyInterest')
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments(query),
    ]);

    const activitiesWithDates = activities.map(activity => ({
      ...activity.toObject(),
      createdAt: activity.createdAt.toISOString(),
    }));

    return NextResponse.json({ 
      activities: activitiesWithDates, 
      total, 
      page, 
      limit 
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}