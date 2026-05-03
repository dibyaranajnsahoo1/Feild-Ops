import connectDB from "@/lib/db/connect";
import Form from "@/models/Form";
import type { CreateFormInput } from "@/lib/validations/schemas";
import type { PaginationParams } from "@/types";

// ─── Create Form ───────────────────────────────────────────────────────────

export async function createForm(
  input: CreateFormInput,
  userId: string,
  organizationId: string
) {
  await connectDB();
  const form = await Form.create({
    ...input,
    organizationId,
    createdBy: userId,
  });
  return form.toObject();
}

// ─── Get Forms ─────────────────────────────────────────────────────────────

export async function getForms(
  organizationId: string,
  params: PaginationParams & { siteId?: string; search?: string }
) {
  await connectDB();

  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", siteId, search } = params;

  const filter: Record<string, unknown> = { organizationId, isActive: true };
  if (siteId) filter["siteId"] = siteId;
  if (search) filter["title"] = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 } as Record<string, 1 | -1>;

  const [forms, total] = await Promise.all([
    Form.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("siteId", "name")
      .populate("createdBy", "name email")
      .lean(),
    Form.countDocuments(filter),
  ]);

  return { forms, total, page, limit };
}

// ─── Get Form by ID ────────────────────────────────────────────────────────

export async function getFormById(formId: string, organizationId: string) {
  await connectDB();
  return Form.findOne({ _id: formId, organizationId })
    .populate("siteId", "name location")
    .populate("createdBy", "name email")
    .lean();
}

// ─── Update Form ───────────────────────────────────────────────────────────

export async function updateForm(
  formId: string,
  organizationId: string,
  updates: Partial<CreateFormInput> & { isActive?: boolean }
) {
  await connectDB();
  return Form.findOneAndUpdate(
    { _id: formId, organizationId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
}

// ─── Delete Form (soft delete) ─────────────────────────────────────────────

export async function deleteForm(formId: string, organizationId: string) {
  await connectDB();
  return Form.findOneAndUpdate(
    { _id: formId, organizationId },
    { isActive: false },
    { new: true }
  ).lean();
}

// ─── Get Public Form (for staff submission) ────────────────────────────────

export async function getPublicForm(formId: string) {
  await connectDB();
  return Form.findOne({ _id: formId, isActive: true })
    .select("title description fields settings siteId")
    .populate("siteId", "name")
    .lean();
}
