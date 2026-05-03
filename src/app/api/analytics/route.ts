import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError } from "@/middleware/api";
import {
  getAnalyticsOverview,
  getSubmissionTrends,
  getSiteMetrics,
  getFormMetrics,
  getStatusDistribution,
  getFormDataAnalytics,
} from "@/services/analyticsService";
import { AnalyticsQuerySchema } from "@/lib/validations/schemas";

// GET /api/analytics/overview
export const GET = withAuth(async (req, session) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = AnalyticsQuerySchema.parse(Object.fromEntries(searchParams));
    const type = searchParams.get("type") ?? "overview";

    switch (type) {
      case "overview":
        return apiSuccess(await getAnalyticsOverview(session.organizationId));
      case "trends":
        return apiSuccess(await getSubmissionTrends(session.organizationId, query));
      case "sites":
        return apiSuccess(await getSiteMetrics(session.organizationId));
      case "forms":
        return apiSuccess(await getFormMetrics(session.organizationId));
      case "status":
        return apiSuccess(
          await getStatusDistribution(
            session.organizationId,
            searchParams.get("siteId") ?? undefined
          )
        );
      case "form-data":
        const formId = searchParams.get("formId");
        if (!formId) return apiError("formId is required", 400);
        return apiSuccess(await getFormDataAnalytics(session.organizationId, formId));
      default:
        return apiError("Invalid analytics type", 400);
    }
  } catch {
    return apiError("Failed to fetch analytics", 500);
  }
}, "manager");
