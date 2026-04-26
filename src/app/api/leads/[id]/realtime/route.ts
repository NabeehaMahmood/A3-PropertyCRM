import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();
  
  const lead = await Lead.findById(id).populate('assignedTo', 'name email');
  
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead, lastUpdate: lead.updatedAt });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  await connectToDatabase();

  const lead = await Lead.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('assignedTo', 'name email');

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Lead updated', lead, notify: true });
}