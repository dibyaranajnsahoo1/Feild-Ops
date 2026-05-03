import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { getSubmissionById } from "@/services/submissionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import SubmissionActions from "@/components/submissions/SubmissionActions";
import { AlertTriangle, Sparkles, User, MapPin, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Submission Detail" };

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  reviewed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  flagged: "bg-red-50 text-red-700 border-red-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
};

export default async function SubmissionDetailPage({
  params,
}: {
  params: { submissionId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const submission = await getSubmissionById(params.submissionId, session.organizationId).catch(
    () => null
  );

  if (!submission) notFound();

  // Staff: only own submissions
  if (
    session.role === "staff" &&
    String((submission as any).submittedBy?._id ?? submission.submittedBy) !== session.sub
  ) {
    redirect("/submissions");
  }

  const form = submission.formId as any;
  const site = submission.siteId as any;
  const submitter = submission.submittedBy as any;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{form?.title ?? "Submission"}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {site?.name ?? "Unknown Site"}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {submitter?.name ?? "Unknown"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(submission.createdAt as any), "PPpp")}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "text-sm px-3 py-1 rounded-full border font-medium capitalize flex-shrink-0",
            STATUS_STYLES[submission.status] ?? STATUS_STYLES.submitted
          )}
        >
          {submission.status}
        </span>
      </div>

      {/* AI Summary */}
      {submission.aiSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" /> AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{submission.aiSummary}</p>
            {(submission.aiAnomalies ?? []).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-amber-700 flex items-center gap-1 mb-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Detected Anomalies
                </p>
                <ul className="space-y-1">
                  {(submission.aiAnomalies ?? []).map((a: string, i: number) => (
                    <li
                      key={i}
                      className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Submitted Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {form?.fields
              ?.sort((a: any, b: any) => a.order - b.order)
              .map((field: any) => {
                const value = (submission.data as any)[field.id];
                if (value === undefined || value === null || value === "") return null;

                return (
                  <div key={field.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {field.label}
                    </dt>
                    <dd className="text-sm">
                      {Array.isArray(value)
                        ? value.join(", ")
                        : String(value)}
                    </dd>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {submission.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reviewer Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{submission.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions (for manager+) */}
      <SubmissionActions
        submissionId={String((submission as any)._id)}
        currentStatus={submission.status}
        userRole={session.role}
      />
    </div>
  );
}
