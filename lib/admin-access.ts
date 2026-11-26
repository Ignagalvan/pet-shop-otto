export function isStaffRole(role: unknown): boolean {
  return role === 'owner' || role === 'admin' || role === 'staff'
}
