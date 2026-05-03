import type { Metadata } from "next";
import { getSession } from "@/lib/auth/jwt";
import { getAnalyticsOverview } from "@/services/analyticsService";
import { getSubmissions } from "@/services/submissionService";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentSubmissions from "@/components/dashboard/RecentSubmissions";
import QuickActions from "@/components/dashboard/QuickActions";
import {
  FileText,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

// Revalidate every 60 seconds
export const revalidate = 60;

export default async function DashboardPage() {
  const session = await getSession();

  const [overview, { submissions }] = await Promise.all([
    getAnalyticsOverview(session!.organizationId).catch(() => null),
    getSubmissions(session!.organizationId, { limit: 5, sortBy: "createdAt", sortOrder: "desc" })
      .catch(() => ({ submissions: [], total: 0, page: 1, limit: 5 })),
  ]);

  const changeLabel =
    overview && overview.changePercent !== 0
      ? `${overview.changePercent > 0 ? "+" : ""}${overview.changePercent}% from last month`
      : "Same as last month";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {session?.name}. Here&apos;s what&apos;s happening.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Submissions"
          value={overview?.totalSubmissions ?? 0}
          description={changeLabel}
          icon={ClipboardList}
          trend={overview?.changePercent}
        />
        <StatsCard
          title="Active Forms"
          value={overview?.totalForms ?? 0}
          description="Forms available"
          icon={FileText}
        />
        <StatsCard
          title="Active Sites"
          value={overview?.activeSites ?? 0}
          description="Sites being monitored"
          icon={MapPin}
        />
        <StatsCard
          title="Flagged Items"
          value={overview?.flaggedSubmissions ?? 0}
          description={`${overview?.pendingReviews ?? 0} pending review`}
          icon={AlertTriangle}
          variant={overview && overview.flaggedSubmissions > 0 ? "warning" : "default"}
        />
      </div>

      {/* This Month */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatsCard
          title="This Month"
          value={overview?.submissionsThisMonth ?? 0}
          description="Submissions recorded"
          icon={TrendingUp}
          className="lg:col-span-1"
        />
        <StatsCard
          title="Pending Review"
          value={overview?.pendingReviews ?? 0}
          description="Awaiting manager review"
          icon={Clock}
          variant={overview && overview.pendingReviews > 5 ? "warning" : "default"}
          className="lg:col-span-1"
        />
        <QuickActions role={session!.role} className="lg:col-span-1" />
      </div>

      {/* Recent Submissions */}
      <RecentSubmissions submissions={submissions as any[]} />
    </div>
  );
}
