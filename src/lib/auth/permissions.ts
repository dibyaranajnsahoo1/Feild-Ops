export type Role = "super_admin" | "admin" | "manager" | "staff";

export function canManageForms(role: Role) {
  return role === "super_admin" || role === "admin" || role === "manager";
}

export function canViewAnalytics(role: Role) {
  return role === "super_admin" || role === "admin" || role === "manager";
}

export function canManageUsers(role: Role) {
  return role === "super_admin" || role === "admin";
}