import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { Role } from "@/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production"
);

export interface JWTPayload {
  sub: string;       // userId
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  iat?: number;
  exp?: number;
}

const TOKEN_EXPIRY = "7d";
const COOKIE_NAME = "fop-auth-token";

// ─── Token Generation ──────────────────────────────────────────────────────

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const decoded = payload as unknown as JWTPayload;
    const rawOrg = decoded.organizationId;
    let organizationId =
      typeof rawOrg === "string"
        ? rawOrg
        : rawOrg && typeof rawOrg === "object"
        ? String((rawOrg as any)._id ?? (rawOrg as any).id ?? rawOrg)
        : String(rawOrg);

    const orgMatch = organizationId.match(/[0-9a-fA-F]{24}/);
    if (orgMatch && organizationId.includes("{")) {
      organizationId = orgMatch[0];
    }

    return {
      ...decoded,
      organizationId,
    };
  } catch {
    return null;
  }
}

// ─── Cookie Management ─────────────────────────────────────────────────────

export function setAuthCookie(token: string): void {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearAuthCookie(): void {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

// ─── Session Extraction ────────────────────────────────────────────────────

export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  // Check Authorization header first (API clients)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  // Fall back to cookie (browser clients)
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── RBAC Helpers ──────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageForms(role: Role): boolean {
  return hasRole(role, "manager");
}

export function canViewAnalytics(role: Role): boolean {
  return hasRole(role, "manager");
}

export function canManageUsers(role: Role): boolean {
  return hasRole(role, "admin");
}

export function canManageSites(role: Role): boolean {
  return hasRole(role, "admin");
}
