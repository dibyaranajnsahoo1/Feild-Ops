import type { Metadata } from "next";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { canViewAnalytics } from "@/lib/auth/jwt";
import {
  getAnalyticsOverview,
  getSubmissionTrends,
  getSiteMetrics,
  getFormMetrics,
  getStatusDistribution,
} from "@/services/analyticsService";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = { title: "Analytics" };
export const revalidate = 300; // 5 min

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session || !canViewAnalytics(session.role)) redirect("/dashboard");

  const [overview, trends, siteMetrics, formMetrics, statusDist] = await Promise.all([
    getAnalyticsOverview(session.organizationId).catch(() => null),
    getSubmissionTrends(session.organizationId, { groupBy: "day" }).catch(() => []),
    getSiteMetrics(session.organizationId).catch(() => []),
    getFormMetrics(session.organizationId).catch(() => []),
    getStatusDistribution(session.organizationId).catch(() => []),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Insights and trends across your field operations
        </p>
      </div>
      <AnalyticsDashboard
        overview={overview}
        trends={trends as any[]}
        siteMetrics={siteMetrics as any[]}
        formMetrics={formMetrics as any[]}
        statusDistribution={statusDist as any[]}
        organizationId={session.organizationId}
      />
    </div>
  );
}
