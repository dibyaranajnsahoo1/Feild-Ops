// ─── Core Domain Types ─────────────────────────────────────────────────────

export type Role = "super_admin" | "admin" | "manager" | "staff";

export type FieldType =
  | "text"
  | "number"
  | "dropdown"
  | "checkbox"
  | "date"
  | "file"
  | "textarea"
  | "email"
  | "phone";

export type SubmissionStatus = "draft" | "submitted" | "reviewed" | "flagged";

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  plan: "free" | "pro" | "enterprise";
  settings: {
    allowSelfRegistration: boolean;
    maxUsers: number;
    maxSites: number;
    maxForms: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organization?: IOrganization;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISite {
  _id: string;
  name: string;
  description?: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  organizationId: string;
  managerId?: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IFormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  order: number;
  options?: string[];          // for dropdown, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  defaultValue?: string | number | boolean;
  helpText?: string;
}

export interface IForm {
  _id: string;
  title: string;
  description?: string;
  fields: IFormField[];
  siteId: string;
  site?: ISite;
  organizationId: string;
  createdBy: string;
  isActive: boolean;
  version: number;
  submissionCount: number;
  settings: {
    allowMultipleSubmissions: boolean;
    requiresApproval: boolean;
    notifyOnSubmission: boolean;
    successMessage: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ISubmission {
  _id: string;
  formId: string;
  form?: Pick<IForm, "_id" | "title">;
  siteId: string;
  site?: Pick<ISite, "_id" | "name">;
  organizationId: string;
  submittedBy: string;
  submitter?: Pick<IUser, "_id" | "name" | "email">;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  aiSummary?: string;
  aiAnomalies?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ─── Analytics Types ───────────────────────────────────────────────────────

export interface AnalyticsOverview {
  totalSubmissions: number;
  submissionsThisMonth: number;
  submissionsLastMonth: number;
  changePercent: number;
  totalForms: number;
  activeSites: number;
  flaggedSubmissions: number;
  pendingReviews: number;
}

export interface SubmissionTrend {
  date: string;
  count: number;
  flagged: number;
}

export interface SiteMetrics {
  siteId: string;
  siteName: string;
  submissionCount: number;
  flaggedCount: number;
  lastSubmission?: string;
}

export interface FormMetrics {
  formId: string;
  formTitle: string;
  submissionCount: number;
  completionRate: number;
  avgSubmissionTime?: number;
}

// ─── Auth Types ────────────────────────────────────────────────────────────

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    organizationId: string;
    avatar?: string;
  };
  expires: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

// ─── AI Types ──────────────────────────────────────────────────────────────

export interface AIInsight {
  type: "summary" | "anomaly" | "trend" | "recommendation";
  content: string;
  severity?: "low" | "medium" | "high";
  confidence?: number;
  relatedSubmissions?: string[];
}

export interface AIAnalysisResult {
  summary: string;
  anomalies: string[];
  insights: AIInsight[];
  generatedAt: string;
}
