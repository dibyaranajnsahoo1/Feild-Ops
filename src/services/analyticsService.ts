import mongoose from "mongoose";
import connectDB from "@/lib/db/connect";
import Submission from "@/models/Submission";
import Form from "@/models/Form";
import Site from "@/models/Site";
import type { AnalyticsQueryInput } from "@/lib/validations/schemas";

// ─── Overview Metrics ──────────────────────────────────────────────────────

export async function getAnalyticsOverview(organizationId: string) {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalSubmissions,
    submissionsThisMonth,
    submissionsLastMonth,
    flaggedSubmissions,
    pendingReviews,
    totalForms,
    activeSites,
  ] = await Promise.all([
    Submission.countDocuments({ organizationId }),
    Submission.countDocuments({ organizationId, createdAt: { $gte: startOfMonth } }),
    Submission.countDocuments({
      organizationId,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    }),
    Submission.countDocuments({ organizationId, status: "flagged" }),
    Submission.countDocuments({ organizationId, status: "submitted" }),
    Form.countDocuments({ organizationId, isActive: true }),
    Site.countDocuments({ organizationId, isActive: true }),
  ]);

  const changePercent =
    submissionsLastMonth === 0
      ? 100
      : Math.round(((submissionsThisMonth - submissionsLastMonth) / submissionsLastMonth) * 100);

  return {
    totalSubmissions,
    submissionsThisMonth,
    submissionsLastMonth,
    changePercent,
    totalForms,
    activeSites,
    flaggedSubmissions,
    pendingReviews,
  };
}

// ─── Submission Trends ─────────────────────────────────────────────────────

export async function getSubmissionTrends(
  organizationId: string,
  query: AnalyticsQueryInput
) {
  await connectDB();

  const { startDate, endDate, siteId, formId, groupBy } = query;

  const matchStage: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(organizationId) };
  if (siteId) matchStage["siteId"] = new mongoose.Types.ObjectId(siteId);
  if (formId) matchStage["formId"] = new mongoose.Types.ObjectId(formId);
  if (startDate || endDate) {
    matchStage["createdAt"] = {
      ...(startDate && { $gte: new Date(startDate) }),
      ...(endDate && { $lte: new Date(endDate) }),
    };
  }

  const dateFormat =
    groupBy === "month" ? "%Y-%m" : groupBy === "week" ? "%Y-W%V" : "%Y-%m-%d";

  const pipeline: mongoose.PipelineStage[] = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        total: { $sum: "$count" },
        flagged: {
          $sum: { $cond: [{ $eq: ["$_id.status", "flagged"] }, "$count", 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: "$total",
        flagged: "$flagged",
      },
    },
  ];

  return Submission.aggregate(pipeline);
}

// ─── Per-Site Metrics ──────────────────────────────────────────────────────

export async function getSiteMetrics(organizationId: string) {
  await connectDB();

  return Submission.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: "$siteId",
        submissionCount: { $sum: 1 },
        flaggedCount: {
          $sum: { $cond: [{ $eq: ["$status", "flagged"] }, 1, 0] },
        },
        lastSubmission: { $max: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "sites",
        localField: "_id",
        foreignField: "_id",
        as: "site",
      },
    },
    { $unwind: { path: "$site", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        siteId: "$_id",
        siteName: { $ifNull: ["$site.name", "Unknown Site"] },
        submissionCount: 1,
        flaggedCount: 1,
        lastSubmission: 1,
      },
    },
    { $sort: { submissionCount: -1 } },
    { $limit: 10 },
  ]);
}

// ─── Per-Form Metrics ──────────────────────────────────────────────────────

export async function getFormMetrics(organizationId: string) {
  await connectDB();

  return Submission.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: "$formId",
        submissionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "forms",
        localField: "_id",
        foreignField: "_id",
        as: "form",
      },
    },
    { $unwind: { path: "$form", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        formId: "$_id",
        formTitle: { $ifNull: ["$form.title", "Unknown Form"] },
        submissionCount: 1,
      },
    },
    { $sort: { submissionCount: -1 } },
    { $limit: 10 },
  ]);
}

// ─── Status Distribution ───────────────────────────────────────────────────

export async function getStatusDistribution(
  organizationId: string,
  siteId?: string
) {
  await connectDB();

  const match: Record<string, unknown> = { organizationId: new mongoose.Types.ObjectId(organizationId) };
  if (siteId) match["siteId"] = new mongoose.Types.ObjectId(siteId);

  return Submission.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);
}

// ─── Form Data Analytics ───────────────────────────────────────────────────

export async function getFormDataAnalytics(organizationId: string, formId: string) {
  await connectDB();

  const form = await Form.findOne({ _id: formId, organizationId }).lean();
  if (!form) throw new Error("Form not found");

  const fields = form.fields as Array<{ id: string; type: string; label: string }>;
  
  const categoricalFields = fields.filter((f) => ["dropdown", "checkbox", "radio"].includes(f.type));
  const numericFields = fields.filter((f) => f.type === "number");

  if (categoricalFields.length === 0 && numericFields.length === 0) {
    return { categorical: [], numeric: [] };
  }

  const facet: Record<string, any[]> = {};

  categoricalFields.forEach((f) => {
    facet[f.id] = [
      { $match: { [`data.${f.id}`]: { $exists: true, $nin: [null, "", []] } } },
      {
        $unwind: {
          path: `$data.${f.id}`,
          preserveNullAndEmptyArrays: false,
        },
      },
      { $group: { _id: `$data.${f.id}`, count: { $sum: 1 } } },
      { $project: { name: { $toString: "$_id" }, count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ];
  });

  numericFields.forEach((f) => {
    facet[f.id] = [
      { $match: { [`data.${f.id}`]: { $type: "number" } } },
      {
        $group: {
          _id: null,
          avg: { $avg: `$data.${f.id}` },
          min: { $min: `$data.${f.id}` },
          max: { $max: `$data.${f.id}` },
        },
      },
      { $project: { _id: 0 } },
    ];
  });

  const [aggregationResult] = await Submission.aggregate([
    { $match: { formId: new mongoose.Types.ObjectId(formId), organizationId: new mongoose.Types.ObjectId(organizationId) } },
    { $facet: facet },
  ]);

  return {
    categorical: categoricalFields.map((f) => ({
      fieldId: f.id,
      label: f.label,
      data: aggregationResult[f.id] || [],
    })).filter(f => f.data.length > 0),
    numeric: numericFields.map((f) => {
      const stats = aggregationResult[f.id]?.[0];
      if (!stats) return null;
      return {
        fieldId: f.id,
        label: f.label,
        avg: Math.round((stats.avg || 0) * 10) / 10,
        min: stats.min || 0,
        max: stats.max || 0,
      };
    }).filter(Boolean),
  };
}
