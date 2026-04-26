import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');
  
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  
  if (since) {
    filter.updatedAt = { $gt: new Date(since) };
  }

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .sort({ updatedAt: -1 })
    .limit(50);

  return NextResponse.json({ 
    leads, 
    timestamp: new Date().toISOString() 
  });
}