import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, apiPaginated } from "@/middleware/api";
import { createSubmission, getSubmissions } from "@/services/submissionService";
import { CreateSubmissionSchema, PaginationSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";
import type { SubmissionStatus } from "@/types";

// GET /api/submissions
export const GET = withAuth(async (req, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const pagination = PaginationSchema.parse(Object.fromEntries(searchParams));

    const params = {
      ...pagination,
      formId: searchParams.get("formId") ?? undefined,
      siteId: searchParams.get("siteId") ?? undefined,
      status: searchParams.get("status") as SubmissionStatus | undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      // Staff can only see their own submissions
      submittedBy: session.role === "staff" ? session.sub : undefined,
    };

    const { submissions, total, page, limit } = await getSubmissions(
      session.organizationId,
      params
    );

    return apiPaginated(submissions, page, limit, total);
  } catch {
    return apiError("Failed to fetch submissions", 500);
  }
}, "staff");

// POST /api/submissions
export const POST = withAuth(async (req, session) => {
  try {
    const body = await req.json();
    const validated = CreateSubmissionSchema.parse(body);

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? "unknown";

    const submission = await createSubmission(
      validated,
      session.sub,
      session.organizationId,
      { ipAddress, userAgent }
    );

    return apiSuccess(submission, 201, "Submission recorded successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return apiError(error.message, 400);
    }
    return apiError("Failed to create submission", 500);
  }
}, "staff");
