import { z } from "zod";

// ─── Auth Schemas ──────────────────────────────────────────────────────────

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100),
});

// ─── Site Schemas ──────────────────────────────────────────────────────────

export const CreateSiteSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(500).optional(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).optional(),
  managerId: z.string().optional(),
});

export const UpdateSiteSchema = CreateSiteSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ─── Form Schemas ──────────────────────────────────────────────────────────

export const FormFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "number", "dropdown", "checkbox", "date", "file", "textarea", "email", "phone"]),
  label: z.string().min(1).max(200),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  helpText: z.string().optional(),
});

export const CreateFormSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  fields: z.array(FormFieldSchema).min(1, "Form must have at least one field"),
  siteId: z.string().min(1, "Site is required"),
  settings: z.object({
    allowMultipleSubmissions: z.boolean().default(true),
    requiresApproval: z.boolean().default(false),
    notifyOnSubmission: z.boolean().default(false),
    successMessage: z.string().default("Thank you! Your submission has been recorded."),
  }).optional(),
});

export const UpdateFormSchema = CreateFormSchema.partial();

// ─── Submission Schemas ────────────────────────────────────────────────────

export const CreateSubmissionSchema = z.object({
  formId: z.string().min(1, "Form ID is required"),
  data: z.record(z.unknown()),
});

export const UpdateSubmissionStatusSchema = z.object({
  status: z.enum(["draft", "submitted", "reviewed", "flagged"]),
  notes: z.string().max(2000).optional(),
});

// ─── User Schemas ──────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(["admin", "manager", "staff"]),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  isActive: z.boolean().optional(),
});

// ─── Query Schemas ─────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const AnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  siteId: z.string().optional(),
  formId: z.string().optional(),
  groupBy: z.enum(["day", "week", "month"]).default("day"),
});

// ─── Type Exports ──────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateSiteInput = z.infer<typeof CreateSiteSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;
export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;
