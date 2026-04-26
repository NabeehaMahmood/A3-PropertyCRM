import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { getCurrentUser } from '@/lib/session';
import { canViewAll } from '@/lib/rbac';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();

    const query = { _id: id } as Record<string, unknown>;
    if (!canViewAll(user.role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query).populate('assignedTo', 'name email');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectToDatabase();

    const query = { _id: id } as Record<string, unknown>;
    if (!canViewAll(user.role)) {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (body.budget && body.budget !== lead.budget) {
      const budgetNumber = parseInt(body.budget.replace(/[^0-9]/g, '') || '0');
      if (budgetNumber > 20000000) body.score = 'high';
      else if (budgetNumber >= 10000000) body.score = 'medium';
      else body.score = 'low';
    }

    const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true }).populate('assignedTo', 'name email');

    return NextResponse.json({ message: 'Lead updated', lead: updatedLead });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await connectToDatabase();

    await Lead.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Lead deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}