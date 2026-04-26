import XLSX from 'xlsx';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Lead } from '@/models/Lead';
import { Activity } from '@/models/Activity';
import { getCurrentUser } from '@/lib/session';
import { canViewAll, Role } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const leadId = searchParams.get('leadId');

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (!canViewAll(user.role as Role)) {
      query.assignedTo = user.userId;
    }
    if (leadId) {
      query._id = leadId;
    }

    const leads = await Lead.find(query).populate('assignedTo', 'name email');
    const activities = await Activity.find(leadId ? { leadId } : {})
      .populate('userId', 'name')
      .populate('leadId', 'name budget status')
      .sort({ createdAt: -1 })
      .limit(500);

    if (format === 'excel') {
      const leadData = leads.map((lead) => ({
        Name: lead.name,
        Email: lead.email,
        Phone: lead.phone,
        'Property Interest': lead.propertyInterest,
        Budget: lead.budget,
        Status: lead.status,
        Priority: lead.score,
        'Assigned To': (lead.assignedTo as unknown as { name: string })?.name || 'Unassigned',
        'Created At': lead.createdAt?.toISOString() || '',
        'Updated At': lead.updatedAt?.toISOString() || '',
      }));

      const ws = XLSX.utils.json_to_sheet(leadData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=leads.xlsx',
        },
      });
    }

    if (format === 'timeline' && leadId) {
      const timeline = activities.map((activity) => ({
        action: activity.action,
        description: activity.description,
        user: (activity.userId as unknown as { name: string })?.name || 'Unknown',
        date: activity.createdAt,
      }));
      return NextResponse.json({ timeline });
    }

    return NextResponse.json({ leads, activities });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}