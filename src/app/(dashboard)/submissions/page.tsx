import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import { getSubmissions } from "@/services/submissionService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Submissions" };

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  reviewed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  flagged: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: { formId?: string; siteId?: string; status?: string };
}) {
  const session = await getSession();

  const { submissions, total } = await getSubmissions(session!.organizationId, {
    formId: searchParams.formId,
    siteId: searchParams.siteId,
    status: searchParams.status as any,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
    // Staff only see their own
    submittedBy: session!.role === "staff" ? session!.sub : undefined,
  }).catch(() => ({ submissions: [], total: 0, page: 1, limit: 20 }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} total submission{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-medium mb-1">No submissions yet</h3>
            <p className="text-sm text-muted-foreground">
              Submissions will appear here once staff start filling out forms
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {submissions.map((sub: any) => (
            <Card key={String(sub._id)} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">
                        {sub.formId?.title ?? "Unknown Form"}
                      </h3>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                          STATUS_STYLES[sub.status] ?? STATUS_STYLES.submitted
                        )}
                      >
                        {sub.status}
                      </span>
                      {sub.aiAnomalies?.length > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          {sub.aiAnomalies.length} anomal{sub.aiAnomalies.length === 1 ? "y" : "ies"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>📍 {sub.siteId?.name ?? "Unknown Site"}</span>
                      <span>👤 {sub.submittedBy?.name ?? "Unknown"}</span>
                      <span>
                        {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {sub.aiSummary && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic">
                        AI: {sub.aiSummary}
                      </p>
                    )}
                  </div>
                  <Button asChild size="sm" variant="ghost" className="h-8 flex-shrink-0">
                    <Link href={`/submissions/${sub._id}`}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
