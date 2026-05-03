import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ISubmission } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  reviewed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  flagged: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface RecentSubmissionsProps {
  submissions: Partial<ISubmission>[];
}

export default function RecentSubmissions({ submissions }: RecentSubmissionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Recent Submissions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/submissions" className="flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No submissions yet. Start by{" "}
            <Link href="/forms" className="text-primary hover:underline">
              creating a form
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-1">
            {submissions.map((submission) => (
              <Link
                key={String(submission._id)}
                href={`/submissions/${submission._id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {(submission.form as any)?.title ?? "Unknown Form"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {(submission.site as any)?.name ?? "Unknown Site"} •{" "}
                    {(submission.submitter as any)?.name ?? "Unknown User"}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      STATUS_COLORS[submission.status ?? "submitted"]
                    )}
                  >
                    {submission.status}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {submission.createdAt
                      ? formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })
                      : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
