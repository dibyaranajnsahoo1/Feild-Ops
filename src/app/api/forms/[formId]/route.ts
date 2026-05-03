import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/middleware/api";
import { getFormById, updateForm, deleteForm } from "@/services/formService";
import { UpdateFormSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

type Ctx = { params: { formId: string } };

// GET /api/forms/[formId]
export const GET = withAuth(async (_req, session, ctx) => {
  const form = await getFormById(ctx!.params.formId, session.organizationId);
  if (!form) return apiError("Form not found", 404);
  return apiSuccess(form);
}, "staff");

// PATCH /api/forms/[formId]
export const PATCH = withAuth(async (req, session, ctx) => {
  try {
    const body = await req.json();
    const validated = UpdateFormSchema.parse(body);
    const form = await updateForm(ctx!.params.formId, session.organizationId, validated);
    if (!form) return apiError("Form not found", 404);
    return apiSuccess(form, 200, "Form updated");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    return apiError("Failed to update form", 500);
  }
}, "manager");

// DELETE /api/forms/[formId]
export const DELETE = withAuth(async (_req, session, ctx) => {
  const form = await deleteForm(ctx!.params.formId, session.organizationId);
  if (!form) return apiError("Form not found", 404);
  return apiSuccess(null, 200, "Form deleted");
}, "manager");
