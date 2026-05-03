import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, hasRole, type JWTPayload } from "@/lib/auth/jwt";
import type { Role } from "@/types";

export type AuthenticatedHandler = (
  req: NextRequest,
  session: JWTPayload,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

// ─── API Response Helpers ─────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200, message?: string): NextResponse {
  return NextResponse.json({ success: true, data, ...(message && { message }) }, { status });
}

export function apiError(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

export function apiPaginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

// ─── Authentication Guard ─────────────────────────────────────────────────

export function withAuth(
  handler: AuthenticatedHandler,
  requiredRole?: Role
): (req: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse> {
  return async (req, context) => {
    const session = await getSessionFromRequest(req);

    if (!session) {
      return apiError("Authentication required", 401);
    }

    if (requiredRole && !hasRole(session.role, requiredRole)) {
      return apiError(
        `Insufficient permissions. Required: ${requiredRole}`,
        403
      );
    }

    return handler(req, session, context);
  };
}

// ─── In-Memory Rate Limiter ───────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  maxRequests = 100,
  windowMs = 15 * 60 * 1000 // 15 minutes
) {
  return (req: NextRequest): NextResponse | null => {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

// ─── Tenant Isolation Guard ───────────────────────────────────────────────

/**
 * Ensures query always scopes to the authenticated user's organization.
 * This is the critical multi-tenant isolation mechanism.
 */
export function tenantFilter(session: JWTPayload): { organizationId: string } {
  return { organizationId: session.organizationId };
}

// ─── Input Sanitization ────────────────────────────────────────────────────

const DANGEROUS_PATTERNS = [
  /\$where/i,
  /\$expr/i,
  /\$function/i,
  /\$accumulator/i,
  /javascript:/i,
  /<script/i,
];

export function sanitizeMongoInput<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key as keyof T];
    if (key.startsWith("$")) {
      delete sanitized[key as keyof T];
      continue;
    }
    if (typeof value === "string") {
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(value)) {
          (sanitized as Record<string, unknown>)[key] = "";
          break;
        }
      }
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeMongoInput(
        value as Record<string, unknown>
      );
    }
  }
  return sanitized;
}
