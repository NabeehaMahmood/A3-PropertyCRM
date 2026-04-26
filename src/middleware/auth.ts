import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { Role, isAdmin, canViewAll, canAssign } from '@/lib/rbac';

export type { Role };
export { isAdmin, canViewAll, canAssign };

export async function authMiddleware(
  request: NextRequest,
  requireRole?: Role[]
) {
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
}

export function getUserFromRequest(request: NextRequest) {
  return getCurrentUser(request);
}