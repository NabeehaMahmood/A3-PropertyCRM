import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { canAssign, Role } from '@/lib/rbac';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAssign(user.role as Role)) {
      return NextResponse.json({ error: 'Forbidden - Only admins and managers can assign leads' }, { status: 403 });
    }

    const { id } = await params;
    const { assignedTo } = await request.json();

    if (!assignedTo) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const agent = await User.findById(assignedTo);
    if (!agent || agent.role !== 'agent') {
      return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
    }

    const lead = await Lead.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead assigned', lead });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}