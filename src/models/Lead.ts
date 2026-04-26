import mongoose, { Document, Schema } from 'mongoose';

export type LeadSource = 'facebook_ads' | 'walk_in' | 'website_inquiry' | 'referral' | 'other';

export type FollowUpOutcome = 'completed' | 'no_show' | 'rescheduled' | 'pending';

export interface IFollowUp {
  scheduledDate: Date;
  completedDate?: Date;
  outcome?: FollowUpOutcome;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
}

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  source: LeadSource;
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed-won' | 'closed-lost';
  assignedTo: mongoose.Types.ObjectId;
  notes: string;
  score: 'high' | 'medium' | 'low';
  followUpDate?: Date;
  lastActivityAt?: Date;
  followUpHistory: IFollowUp[];
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    propertyInterest: { type: String, required: true },
    budget: { type: Number, required: true },
    source: {
      type: String,
      enum: ['facebook_ads', 'walk_in', 'website_inquiry', 'referral', 'other'],
      required: true,
      default: 'other',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'negotiation', 'closed-won', 'closed-lost'],
      default: 'new',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
    score: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low',
    },
    followUpDate: { type: Date },
    lastActivityAt: { type: Date, default: Date.now },
    followUpHistory: [{
      scheduledDate: { type: Date, required: true },
      completedDate: { type: Date },
      outcome: { 
        type: String, 
        enum: ['completed', 'no_show', 'rescheduled', 'pending'],
        default: 'pending'
      },
      notes: { type: String },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    }],
  },
  { timestamps: true }
);

export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
