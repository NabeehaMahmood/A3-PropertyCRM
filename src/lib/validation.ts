import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  propertyInterest: z.string().min(1, 'Property interest is required'),
  budget: z.string().min(1, 'Budget is required'),
  notes: z.string().optional(),
});

export const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  propertyInterest: z.string().min(1).optional(),
  budget: z.string().min(1).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'negotiation', 'closed-won', 'closed-lost']).optional(),
  notes: z.string().optional(),
  score: z.enum(['high', 'medium', 'low']).optional(),
  followUpDate: z.string().optional(),
});

export const assignmentSchema = z.object({
  assignedTo: z.string().min(1, 'Agent ID is required'),
});

export const userRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'agent']).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const activitySchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  action: z.enum(['created', 'status_updated', 'assigned', 'reassigned', 'notes_updated', 'followup_set', 'followup_completed']),
  description: z.string().min(1, 'Description is required'),
  metadata: z.record(z.unknown()).optional(),
});

export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: errors };
  }
  
  return { success: true, data: result.data };
}

export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(params);
  
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(', ');
    return { success: false, error: errors };
  }
  
  return { success: true, data: result.data };
}