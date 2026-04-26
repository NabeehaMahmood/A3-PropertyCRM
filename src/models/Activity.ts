import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'status_updated' | 'assigned' | 'reassigned' | 'notes_updated' | 'followup_set' | 'followup_completed' | 'deleted' | 'viewed';
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { 
      type: String, 
      enum: ['created', 'updated', 'status_updated', 'assigned', 'reassigned', 'notes_updated', 'followup_set', 'followup_completed', 'deleted', 'viewed'], 
      required: true 
    },
    description: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);