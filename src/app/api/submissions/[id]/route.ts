import { withAuth, apiSuccess, apiError } from "@/middleware/api";
import { getSubmissionById, updateSubmissionStatus } from "@/services/submissionService";
import { UpdateSubmissionStatusSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

// GET /api/submissions/[id]
export const GET = withAuth(async (_req, session, ctx) => {
  const submission = await getSubmissionById(ctx!.params.id as string, session.organizationId);
  if (!submission) return apiError("Submission not found", 404);

  // Staff can only see their own submissions
  if (
    session.role === "staff" &&
    String(submission.submittedBy) !== session.sub
  ) {
    return apiError("Access denied", 403);
  }

  return apiSuccess(submission);
}, "staff");

// PATCH /api/submissions/[id] - Update status (manager+)
export const PATCH = withAuth(async (req, session, ctx) => {
  try {
    const body = await req.json();
    const { status, notes } = UpdateSubmissionStatusSchema.parse(body);

    const submission = await updateSubmissionStatus(
      ctx!.params.id as string,
      session.organizationId,
      status,
      session.sub,
      notes
    );

    if (!submission) return apiError("Submission not found", 404);
    return apiSuccess(submission, 200, "Submission updated");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    return apiError("Failed to update submission", 500);
  }
}, "manager");
