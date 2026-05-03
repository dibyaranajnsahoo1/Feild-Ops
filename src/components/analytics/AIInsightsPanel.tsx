"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertTriangle, TrendingUp, Info, Lightbulb } from "lucide-react";
import type { AIAnalysisResult, AIInsight } from "@/types";
import { cn } from "@/lib/utils";

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  trend: TrendingUp,
  anomaly: AlertTriangle,
  summary: Info,
  recommendation: Lightbulb,
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
};

interface AIInsightsPanelProps {
  organizationId: string;
  siteId?: string;
}

export default function AIInsightsPanel({ organizationId, siteId }: AIInsightsPanelProps) {
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate insights");
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription className="mt-1">
                Generate intelligent analysis of your field operations data using AI
              </CardDescription>
            </div>
            <Button onClick={fetchInsights} disabled={loading} size="sm">
              {loading ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="mr-2 h-3 w-3" /> Generate Insights</>
              )}
            </Button>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {!result && !loading && !error && (
          <CardContent className="pt-0">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Click &quot;Generate Insights&quot; to analyze your recent submissions
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                AI will summarize trends, detect anomalies, and provide recommendations
              </p>
            </div>
          </CardContent>
        )}

        {result && (
          <CardContent className="pt-0 space-y-4">
            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> Executive Summary
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Anomalies */}
            {result.anomalies.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Detected Anomalies
                </h3>
                <ul className="space-y-1.5">
                  {result.anomalies.map((anomaly, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm p-2.5 bg-amber-50 rounded-md border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      {anomaly}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insights */}
            {result.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Detailed Insights</h3>
                <div className="space-y-2">
                  {result.insights.map((insight, i) => {
                    const Icon = INSIGHT_ICONS[insight.type] ?? Info;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "p-3 rounded-lg border text-sm",
                          insight.severity
                            ? SEVERITY_COLORS[insight.severity]
                            : "bg-muted border-border"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="font-medium capitalize">{insight.type}</span>
                          {insight.severity && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                              {insight.severity}
                            </Badge>
                          )}
                          {insight.confidence && (
                            <span className="text-xs opacity-70 ml-auto">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed">{insight.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
              Generated {new Date(result.generatedAt).toLocaleString()}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
