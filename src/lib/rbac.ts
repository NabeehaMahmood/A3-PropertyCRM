export type Role = 'admin' | 'manager' | 'agent';

export const ROLES: Role[] = ['admin', 'manager', 'agent'];

export const ROLE_PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'assign', 'view_all'],
  manager: ['create', 'read', 'update', 'assign'],
  agent: ['create', 'read', 'update_own'],
} as const;

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission as keyof typeof permissions);
}

export function canViewAll(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

export function canAssign(role: Role): boolean {
  return role === 'admin' || role === 'manager';
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}