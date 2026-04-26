import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: string;
  status: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'closed-won' | 'closed-lost';
  assignedTo: mongoose.Types.ObjectId;
  notes: string;
  score: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    propertyInterest: { type: String, required: true },
    budget: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['new', 'contacted', 'qualified', 'negotiation', 'closed-won', 'closed-lost'], 
      default: 'new' 
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
    score: { 
      type: String, 
      enum: ['high', 'medium', 'low'], 
      default: 'low' 
    },
  },
  { timestamps: true }
);

export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);