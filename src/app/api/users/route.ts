import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiPaginated } from "@/middleware/api";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import { CreateUserSchema, PaginationSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

// GET /api/users - List org users (admin+)
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const { page, limit } = PaginationSchema.parse(Object.fromEntries(searchParams));

  await connectDB();
  const filter = { organizationId: session.organizationId };
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return apiPaginated(users, page, limit, total);
}, "admin");

// POST /api/users - Invite user (admin+)
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const validated = CreateUserSchema.parse(body);

    await connectDB();

    const existing = await User.findOne({ email: validated.email }).lean();
    if (existing) return apiError("A user with this email already exists", 409);

    const user = await User.create({
      ...validated,
      organizationId: session.organizationId,
    });

    return apiSuccess(
      { id: String(user._id), email: user.email, name: user.name, role: user.role },
      201,
      "User created successfully"
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    return apiError("Failed to create user", 500);
  }
}, "admin");
