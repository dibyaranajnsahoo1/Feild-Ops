"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIInsightsPanel from "@/components/analytics/AIInsightsPanel";
import FormDataAnalytics from "@/components/analytics/FormDataAnalytics";
import StatsCard from "@/components/dashboard/StatsCard";
import { TrendingUp, AlertTriangle, FileText, MapPin, ClipboardList, Clock } from "lucide-react";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(30, 80%, 55%)",
  "hsl(271, 81%, 56%)",
  "hsl(0, 72%, 51%)",
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "hsl(221, 83%, 53%)",
  reviewed: "hsl(142, 76%, 36%)",
  flagged: "hsl(0, 72%, 51%)",
  draft: "hsl(215, 16%, 47%)",
};

interface Props {
  overview: any;
  trends: any[];
  siteMetrics: any[];
  formMetrics: any[];
  statusDistribution: any[];
  organizationId: string;
}

export default function AnalyticsDashboard({
  overview,
  trends,
  siteMetrics,
  formMetrics,
  statusDistribution,
  organizationId,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Submissions"
          value={overview?.totalSubmissions ?? 0}
          icon={ClipboardList}
          trend={overview?.changePercent}
          description={`${overview?.changePercent > 0 ? "+" : ""}${overview?.changePercent ?? 0}% vs last month`}
        />
        <StatsCard title="Active Forms" value={overview?.totalForms ?? 0} icon={FileText} />
        <StatsCard title="Active Sites" value={overview?.activeSites ?? 0} icon={MapPin} />
        <StatsCard
          title="Flagged"
          value={overview?.flaggedSubmissions ?? 0}
          icon={AlertTriangle}
          variant={overview?.flaggedSubmissions > 0 ? "warning" : "default"}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Trends</TabsTrigger>
          <TabsTrigger value="sites">By Site</TabsTrigger>
          <TabsTrigger value="forms">By Form</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="form-data">Form Data</TabsTrigger>
        </TabsList>

        {/* Submission Trends */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Trends</CardTitle>
              <CardDescription>Daily submission volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No data available yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trends} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[4]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[4]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Submissions"
                      stroke={CHART_COLORS[0]}
                      fill="url(#colorCount)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="flagged"
                      name="Flagged"
                      stroke={CHART_COLORS[4]}
                      fill="url(#colorFlagged)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {statusDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                    No data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, percent }) =>
                          `${status} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell
                            key={entry.status}
                            fill={STATUS_COLORS[entry.status] ?? CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">This Month vs Last</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 pt-4">
                  {[
                    { label: "This Month", value: overview?.submissionsThisMonth ?? 0, color: CHART_COLORS[0] },
                    { label: "Last Month", value: overview?.submissionsLastMonth ?? 0, color: CHART_COLORS[2] },
                    { label: "Flagged", value: overview?.flaggedSubmissions ?? 0, color: CHART_COLORS[4] },
                    { label: "Pending Review", value: overview?.pendingReviews ?? 0, color: CHART_COLORS[3] },
                  ].map(({ label, value, color }) => {
                    const max = Math.max(overview?.submissionsThisMonth ?? 1, 1);
                    const pct = Math.min((value / max) * 100, 100);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{value.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Site */}
        <TabsContent value="sites" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submissions by Site</CardTitle>
              <CardDescription>Top 10 sites by submission volume</CardDescription>
            </CardHeader>
            <CardContent>
              {siteMetrics.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No site data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={siteMetrics}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="siteName"
                      type="category"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="submissionCount" name="Total" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="flaggedCount" name="Flagged" fill={CHART_COLORS[4]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Form */}
        <TabsContent value="forms" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submissions by Form</CardTitle>
            </CardHeader>
            <CardContent>
              {formMetrics.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  No form data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formMetrics} margin={{ top: 4, right: 4, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="formTitle"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar
                      dataKey="submissionCount"
                      name="Submissions"
                      radius={[4, 4, 0, 0]}
                    >
                      {formMetrics.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="ai" className="mt-4">
          <AIInsightsPanel organizationId={organizationId} />
        </TabsContent>

        {/* Form Data Analytics */}
        <TabsContent value="form-data" className="mt-4">
          <FormDataAnalytics formMetrics={formMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
