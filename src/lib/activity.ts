import connectToDatabase from '@/lib/db';
import { Activity } from '@/models/Activity';
import { Lead } from '@/models/Lead';

type ActivityAction = 'created' | 'status_updated' | 'assigned' | 'reassigned' | 'notes_updated' | 'followup_set' | 'followup_completed' | 'updated' | 'deleted' | 'viewed';

export async function logActivity(
  leadId: string,
  userId: string,
  action: ActivityAction,
  description: string,
  metadata?: Record<string, unknown>
) {
  await connectToDatabase();

  await Activity.create({
    leadId,
    userId,
    action,
    description,
    metadata,
  });

  await Lead.findByIdAndUpdate(leadId, {
    lastActivityAt: new Date(),
  });
}

export async function getLeadActivities(leadId: string) {
  await connectToDatabase();

  return Activity.find({ leadId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
}