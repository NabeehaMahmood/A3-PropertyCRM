export type Role = 'admin' | 'agent';

export const ROLES: Role[] = ['admin', 'agent'];

export const ROLE_PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'assign', 'view_all'],
  agent: ['create', 'read', 'update_own'],
} as const;

export function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] as readonly string[];
  return permissions.includes(permission);
}

export function canViewAll(role: Role): boolean {
  return role === 'admin';
}

export function canAssign(role: Role): boolean {
  return role === 'admin';
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}
