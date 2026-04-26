import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Activity } from '@/models/Activity';
import { getCurrentUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (leadId) {
      query.leadId = leadId;
    }

    const activities = await Activity.find(query)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ activities });
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

    const { leadId, action, description, metadata } = await request.json();

    if (!leadId || !action || !description) {
      return NextResponse.json(
        { error: 'Lead ID, action and description are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const activity = await Activity.create({
      leadId,
      userId: user.userId,
      action,
      description,
      metadata,
    });

    await activity.populate('userId', 'name');

    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}