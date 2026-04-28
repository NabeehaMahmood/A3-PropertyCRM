export type Role = 'admin' | 'agent';

export const ROLES: Role[] = ['admin', 'agent'];

export const ROLE_PERMISSIONS = {
  admin: ['create', 'read', 'update', 'delete', 'assign', 'view_all'],
  agent: ['read', 'view_own', 'contact'],
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

export function canCreateLead(role: Role): boolean {
  return role === 'admin';
}

export function canUpdateLead(role: Role): boolean {
  return role === 'admin';
}

export function canDeleteLead(role: Role): boolean {
  return role === 'admin';
}

export function canContactLead(role: Role): boolean {
  return role === 'agent' || role === 'admin';
}
