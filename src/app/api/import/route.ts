import * as XLSX from 'xlsx';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';
import { getCurrentUser } from '@/lib/session';
import { sendLeadAssignmentNotification } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import { calculateScore } from '@/app/api/leads/route';

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assignedTo = formData.get('assignedTo') as string || '';
    const autoAssign = formData.get('autoAssign') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    await connectToDatabase();

    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    let targetAgentId = assignedTo || null;

    if (autoAssign) {
      const agents = await User.find({ role: 'agent' }).sort({ name: 1 });
      if (agents.length > 0) {
        const leadCounts = await Promise.all(
          agents.map(async (agent) => ({
            agentId: agent._id.toString(),
            count: await Lead.countDocuments({
              assignedTo: agent._id,
              status: { $nin: ['closed-won', 'closed-lost'] },
            }),
          }))
        );
        const minCount = Math.min(...leadCounts.map((l) => l.count));
        const leastLoaded = leadCounts.find((l) => l.count === minCount);
        targetAgentId = leastLoaded?.agentId || agents[0]._id.toString();
      }
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      try {
        const name = String(row.Name || row.name || '').trim();
        const email = String(row.Email || row.email || '').trim();
        const phone = String(row.Phone || row.phone || '').trim();
        const propertyInterest = String(row['Property Interest'] || row.propertyInterest || row.Property || '').trim();
        const budgetRaw = row.Budget || row.budget || 0;
        const budget = typeof budgetRaw === 'string' ? parseInt(budgetRaw.toString().replace(/[^0-9]/g, '')) || 0 : Number(budgetRaw);
        const source = mapSource(String(row.Source || row.source || 'other'));
        const notes = String(row.Notes || row.notes || '').trim();

        if (!name || !email || !phone || !propertyInterest || budget <= 0) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        const existingLead = await Lead.findOne({ email });
        if (existingLead) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Lead with email ${email} already exists`);
          continue;
        }

        const score = calculateScore(budget);

        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + (score === 'high' ? 1 : score === 'medium' ? 3 : 7));

        const lead = await Lead.create({
          name,
          email,
          phone,
          propertyInterest,
          budget,
          notes,
          source,
          assignedTo: targetAgentId,
          score,
          followUpDate,
          status: 'new',
        });

        await lead.populate('assignedTo', 'name email');

        await logActivity(
          lead._id.toString(),
          user.userId,
          'created',
          `Lead imported from file with ${score} priority score`
        );

        if (lead.assignedTo) {
          sendLeadAssignmentNotification({
            leadName: name,
            leadEmail: email,
            leadPhone: phone,
            propertyInterest,
            budget: budget.toString(),
            agentName: (lead.assignedTo as any)?.name,
          }).catch((err) => console.error('Failed to send assignment email:', err));
        }

        results.success++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${i + 2}: ${errorMessage}`);
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      results,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function mapSource(source: string): 'facebook_ads' | 'walk_in' | 'website_inquiry' | 'referral' | 'other' {
  const normalized = source.toLowerCase().replace(/[_\s]+/g, '_');
  if (normalized.includes('facebook') || normalized.includes('fb')) return 'facebook_ads';
  if (normalized.includes('walk') || normalized.includes('walkin')) return 'walk_in';
  if (normalized.includes('website') || normalized.includes('web')) return 'website_inquiry';
  if (normalized.includes('referral') || normalized.includes('refer')) return 'referral';
  return 'other';
}