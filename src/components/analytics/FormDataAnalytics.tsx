"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 76%, 36%)",
  "hsl(30, 80%, 55%)",
  "hsl(271, 81%, 56%)",
  "hsl(0, 72%, 51%)",
];

interface FormDataAnalyticsProps {
  formMetrics: Array<{ formId: string; formTitle: string }>;
}

export default function FormDataAnalytics({ formMetrics }: FormDataAnalyticsProps) {
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formMetrics.length > 0 && !selectedFormId) {
      const firstFormId = formMetrics[0]?.formId;
      if (firstFormId) setSelectedFormId(firstFormId);
    }
  }, [formMetrics, selectedFormId]);

  useEffect(() => {
    if (!selectedFormId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics?type=form-data&formId=${selectedFormId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData.success) {
          setData(resData.data);
        } else {
          setError(resData.error || "Failed to load form data analytics");
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedFormId]);

  if (formMetrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No forms available for analysis
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Select Form:</label>
        <Select value={selectedFormId} onValueChange={setSelectedFormId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a form" />
          </SelectTrigger>
          <SelectContent>
            {formMetrics.map((f) => (
              <SelectItem key={f.formId} value={f.formId}>
                {f.formTitle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center h-64 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {data.categorical.length === 0 && data.numeric.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm border rounded-lg bg-muted/20">
              No aggregateable data found for this form
            </div>
          )}

          {data.numeric.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.numeric.map((field: any) => (
                <Card key={field.fieldId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground font-medium">
                      {field.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{field.avg}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: {field.min} | Max: {field.max}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data.categorical.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.categorical.map((field: any) => (
                <Card key={field.fieldId}>
                  <CardHeader>
                    <CardTitle className="text-base">{field.label}</CardTitle>
                    <CardDescription>Distribution of responses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={field.data}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {field.data.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
