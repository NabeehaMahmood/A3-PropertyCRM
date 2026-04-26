import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
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

export function authMiddleware(request: NextRequest) {
  const user = getCurrentUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return null;
}