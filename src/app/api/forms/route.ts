import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiPaginated, tenantFilter } from "@/middleware/api";
import { getForms, createForm } from "@/services/formService";
import { CreateFormSchema, PaginationSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

// GET /api/forms - List forms (manager+ can see all, staff only sees active)
export const GET = withAuth(async (req, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const pagination = PaginationSchema.parse(Object.fromEntries(searchParams));
    const siteId = searchParams.get("siteId") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const { forms, total, page, limit } = await getForms(
      session.organizationId,
      { ...pagination, siteId, search }
    );

    return apiPaginated(forms, page, limit, total);
  } catch {
    return apiError("Failed to fetch forms", 500);
  }
}, "staff");

// POST /api/forms - Create form (manager+)
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const validated = CreateFormSchema.parse(body);
    const form = await createForm(validated, session.sub, session.organizationId);
    return apiSuccess(form, 201, "Form created successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    return apiError("Failed to create form", 500);
  }
}, "manager");
