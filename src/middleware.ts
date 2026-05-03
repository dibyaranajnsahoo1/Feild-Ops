import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

// Routes accessible without authentication
const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
]);

// Routes that require specific roles
const ROLE_PROTECTED: Array<{ pattern: RegExp; requiredRole: string }> = [
  { pattern: /^\/api\/analytics/, requiredRole: "manager" },
  { pattern: /^\/api\/ai\//, requiredRole: "manager" },
  { pattern: /^\/api\/sites$/, requiredRole: "admin" },    // POST only, GET is broader
  { pattern: /^\/api\/users/, requiredRole: "admin" },
];

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 4,
  admin: 3,
  manager: 2,
  staff: 1,
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Extract token from cookie or Authorization header
  const token =
    request.cookies.get("fop-auth-token")?.value ??
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    // API routes return 401 JSON; page routes redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyToken(token);
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check role-based access for specific API routes
  for (const { pattern, requiredRole } of ROLE_PROTECTED) {
    if (pattern.test(pathname)) {
      const userLevel = ROLE_HIERARCHY[session.role] ?? 0;
      const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;
      if (userLevel < requiredLevel) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }
  }

  function normalizeHeaderValue(value: unknown): string {
    if (typeof value === "string") {
      if (value.includes("\n") || value.includes("{")) {
        const match = value.match(/[0-9a-fA-F]{24}/);
        if (match) return match[0];
        return value.replace(/\r?\n|\r/g, " ");
      }
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if ("_id" in obj) return String(obj._id);
      if ("id" in obj) return String(obj.id);
      if (typeof (obj as any).toHexString === "function") {
        return (obj as any).toHexString();
      }
      if (typeof obj.toString === "function" && obj.toString !== Object.prototype.toString) {
        const str = obj.toString();
        const match = str.match(/[0-9a-fA-F]{24}/);
        if (match && str.includes("{")) return match[0];
        return str.replace(/\r?\n|\r/g, " ");
      }
    }
    return "";
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", normalizeHeaderValue(session.sub));
  requestHeaders.set("x-user-role", normalizeHeaderValue(session.role));
  requestHeaders.set("x-org-id", normalizeHeaderValue(session.organizationId));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
