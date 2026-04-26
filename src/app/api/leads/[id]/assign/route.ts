import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { canAssign, Role } from '@/lib/rbac';
import { logActivity } from '@/lib/activity';
import { sendLeadAssignmentNotification } from '@/lib/email';

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { assignedTo } = await request.json();

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify agent exists
    const agent = await User.findById(assignedTo);
    if (!agent || agent.role !== 'agent') {
      return NextResponse.json(
        { error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const previousAssigned = lead.assignedTo?.toString();

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true }
    ).populate('assignedTo', 'name email');

    await logActivity(
      id,
      user.userId,
      previousAssigned ? 'reassigned' : 'assigned',
      previousAssigned 
        ? `Lead reassigned to ${agent.name}`
        : `Lead assigned to ${agent.name}`
    );

    sendLeadAssignmentNotification({
      leadName: lead.name,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      propertyInterest: lead.propertyInterest,
      budget: lead.budget.toString(),
      agentName: agent.name,
    }).catch(console.error);

    return NextResponse.json({ message: 'Lead assigned', lead: updatedLead });
  } catch (error) {
    console.error('Error assigning lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
