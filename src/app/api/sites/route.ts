import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiPaginated } from "@/middleware/api";
import connectDB from "@/lib/db/connect";
import Site from "@/models/Site";
import { CreateSiteSchema, PaginationSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

// GET /api/sites
export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url);
  const { page, limit } = PaginationSchema.parse(Object.fromEntries(searchParams));

  await connectDB();
  const filter = { organizationId: session.organizationId, isActive: true };
  const skip = (page - 1) * limit;

  const [sites, total] = await Promise.all([
    Site.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .populate("managerId", "name email")
      .lean(),
    Site.countDocuments(filter),
  ]);

  return apiPaginated(sites, page, limit, total);
}, "staff");

// POST /api/sites
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const validated = CreateSiteSchema.parse(body);

    await connectDB();
    const site = await Site.create({
      ...validated,
      organizationId: session.organizationId,
    });

    return apiSuccess(site, 201, "Site created successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    if ((error as any).code === 11000) {
      return apiError("A site with this name already exists", 409);
    }
    return apiError("Failed to create site", 500);
  }
}, "admin");
