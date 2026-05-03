"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, Flag, Eye } from "lucide-react";
import type { Role, SubmissionStatus } from "@/types";
import { canViewAnalytics } from "@/lib/auth/permissions";

interface SubmissionActionsProps {
  submissionId: string;
  currentStatus: SubmissionStatus;
  userRole: Role;
}

export default function SubmissionActions({
  submissionId,
  currentStatus,
  userRole,
}: SubmissionActionsProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canViewAnalytics(userRole)) return null; // Only manager+ see actions

  const updateStatus = async (status: SubmissionStatus) => {
    setLoading(status);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="notes" className="text-sm">Add Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add review notes or comments..."
            className="mt-1 resize-none"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {currentStatus !== "reviewed" && (
            <Button
              size="sm"
              onClick={() => updateStatus("reviewed")}
              disabled={!!loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading === "reviewed" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-3.5 w-3.5" />
              )}
              Mark as Reviewed
            </Button>
          )}

          {currentStatus !== "flagged" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateStatus("flagged")}
              disabled={!!loading}
            >
              {loading === "flagged" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Flag className="mr-2 h-3.5 w-3.5" />
              )}
              Flag for Attention
            </Button>
          )}

          {currentStatus !== "submitted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("submitted")}
              disabled={!!loading}
            >
              {loading === "submitted" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="mr-2 h-3.5 w-3.5" />
              )}
              Reset to Submitted
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
