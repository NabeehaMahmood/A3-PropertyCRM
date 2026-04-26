import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { validateBody } from '@/lib/validation';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { z } from 'zod';
import { Role, canViewAll } from '@/lib/rbac';

export function createAuthMiddleware(requireRole?: Role[]) {
  return function (request: NextRequest) {
    const user = getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (requireRole && requireRole.length > 0) {
      if (!requireRole.includes(user.role as Role)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    
    return null;
  };
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return function (request: NextRequest) {
    const result = validateBody(schema, {});
    return null;
  };
}

export function createRateLimitMiddleware(request: NextRequest) {
  const user = getCurrentUser(request);
  const role = user?.role || 'default';
  
  return rateLimitMiddleware(request, role);
}

export function validateRequest<T>(request: NextRequest, schema: z.ZodSchema<T>): { valid: boolean; data?: T; error?: string } {
  try {
    const body = request.clone ? {} : null;
    return { valid: false, error: 'Cannot read request body' };
  } catch {
    return { valid: false, error: 'Invalid request' };
  }
}