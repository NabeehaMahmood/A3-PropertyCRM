import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, context: RouteContext) {
  const user = getCurrentUser(request as unknown as NextRequest);
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  
  const lastUpdate = new Date(Date.now() - 60000);
  
  const lead = await Lead.findById(context.params.id).populate('assignedTo', 'name email');
  
  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  return Response.json({ lead, lastUpdate: lead.updatedAt });
}

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, context: RouteContext) {
  const user = getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assignedTo } = await request.json();

  await connectToDatabase();

  const agent = await User.findById(assignedTo);
  if (!agent || agent.role !== 'agent') {
    return NextResponse.json({ error: 'Invalid agent' }, { status: 400 });
  }

  const lead = await Lead.findByIdAndUpdate(
    context.params.id,
    { assignedTo },
    { new: true }
  ).populate('assignedTo', 'name email');

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Lead assigned', lead, notify: true });
}