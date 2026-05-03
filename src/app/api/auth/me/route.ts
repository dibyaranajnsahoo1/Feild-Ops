import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/middleware/api";
import { clearAuthCookie } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";

// GET /api/auth/me - Get current session user
export const GET = withAuth(async (_req, session) => {
  try {
    await connectDB();
    const user = await User.findById(session.sub)
      .populate("organizationId", "name slug plan settings")
      .lean();

    if (!user) return apiError("User not found", 404);

    return apiSuccess({
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      organization: user.organizationId,
      lastLoginAt: user.lastLoginAt,
    });
  } catch {
    return apiError("Failed to fetch user", 500);
  }
});

// DELETE /api/auth/me - Logout
export async function DELETE(_req: NextRequest) {
  clearAuthCookie();
  return apiSuccess(null, 200, "Logged out successfully");
}
