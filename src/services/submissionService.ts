import connectDB from "@/lib/db/connect";
import Submission from "@/models/Submission";
import Form from "@/models/Form";
import { analyzeSubmission } from "@/lib/ai/aiService";
import type { CreateSubmissionInput } from "@/lib/validations/schemas";
import type { PaginationParams, SubmissionStatus } from "@/types";

// ─── Create Submission ─────────────────────────────────────────────────────

export async function createSubmission(
  input: CreateSubmissionInput,
  userId: string,
  organizationId: string,
  meta: { ipAddress?: string; userAgent?: string }
) {
  await connectDB();

  const form = await Form.findOne({
    _id: input.formId,
    organizationId,
    isActive: true,
  }).lean();

  if (!form) throw new Error("Form not found or inactive");

  // Server-side field validation against the dynamic schema
  validateSubmissionData(input.data, form.fields as any[]);

  const submission = await Submission.create({
    formId: input.formId,
    siteId: form.siteId,
    organizationId,
    submittedBy: userId,
    data: input.data,
    status: form.settings.requiresApproval ? "draft" : "submitted",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  // Async AI analysis - don't block the response
  analyzeSubmission(
    { data: submission.data, createdAt: submission.createdAt.toISOString() },
    { title: form.title, fields: form.fields as any[] }
  )
    .then(({ summary, anomalies }) => {
      const status = anomalies.length > 0 ? "flagged" : submission.status;
      return Submission.findByIdAndUpdate(submission._id, {
        aiSummary: summary,
        aiAnomalies: anomalies,
        status,
      });
    })
    .catch((err) => console.error("Async AI analysis failed:", err));

  return submission.toObject();
}

// ─── Get Submissions ───────────────────────────────────────────────────────

export async function getSubmissions(
  organizationId: string,
  params: PaginationParams & {
    formId?: string;
    siteId?: string;
    status?: SubmissionStatus;
    startDate?: string;
    endDate?: string;
    submittedBy?: string;
  }
) {
  await connectDB();

  const {
    page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc",
    formId, siteId, status, startDate, endDate, submittedBy,
  } = params;

  const filter: Record<string, unknown> = { organizationId };
  if (formId) filter["formId"] = formId;
  if (siteId) filter["siteId"] = siteId;
  if (status) filter["status"] = status;
  if (submittedBy) filter["submittedBy"] = submittedBy;
  if (startDate || endDate) {
    filter["createdAt"] = {
      ...(startDate && { $gte: new Date(startDate) }),
      ...(endDate && { $lte: new Date(endDate) }),
    };
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

  const [submissions, total] = await Promise.all([
    Submission.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("formId", "title")
      .populate("siteId", "name")
      .populate("submittedBy", "name email")
      .lean(),
    Submission.countDocuments(filter),
  ]);

  return { submissions, total, page, limit };
}

// ─── Get Single Submission ─────────────────────────────────────────────────

export async function getSubmissionById(id: string, organizationId: string) {
  await connectDB();
  return Submission.findOne({ _id: id, organizationId })
    .populate("formId", "title fields")
    .populate("siteId", "name location")
    .populate("submittedBy", "name email avatar")
    .populate("reviewedBy", "name email")
    .lean();
}

// ─── Update Submission Status ──────────────────────────────────────────────

export async function updateSubmissionStatus(
  id: string,
  organizationId: string,
  status: SubmissionStatus,
  reviewerId: string,
  notes?: string
) {
  await connectDB();
  return Submission.findOneAndUpdate(
    { _id: id, organizationId },
    {
      status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      ...(notes && { notes }),
    },
    { new: true }
  ).lean();
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function validateSubmissionData(
  data: Record<string, unknown>,
  fields: Array<{
    id: string;
    label: string;
    required: boolean;
    type: string;
    validation?: { min?: number; max?: number; pattern?: string };
  }>
) {
  const errors: string[] = [];

  for (const field of fields) {
    const value = data[field.id];

    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`"${field.label}" is required`);
      continue;
    }

    if (value !== undefined && value !== null && value !== "") {
      if (field.type === "number" && field.validation) {
        const num = Number(value);
        if (field.validation.min !== undefined && num < field.validation.min) {
          errors.push(`"${field.label}" must be at least ${field.validation.min}`);
        }
        if (field.validation.max !== undefined && num > field.validation.max) {
          errors.push(`"${field.label}" must be at most ${field.validation.max}`);
        }
      }
      if (field.type === "email" && typeof value === "string") {
        if (!/^\S+@\S+\.\S+$/.test(value)) {
          errors.push(`"${field.label}" must be a valid email address`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }
}
