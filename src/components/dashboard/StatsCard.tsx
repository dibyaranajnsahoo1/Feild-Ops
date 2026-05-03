import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  trend?: number;
  variant?: "default" | "warning" | "success";
  className?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-lg",
              variant === "warning" && "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
              variant === "success" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
              variant === "default" && "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            variant === "warning" && "text-amber-600 dark:text-amber-400",
            variant === "success" && "text-emerald-600 dark:text-emerald-400"
          )}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {(description || trend !== undefined) && (
          <div className="flex items-center gap-1 mt-1">
            {trend !== undefined && (
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  trend > 0 ? "text-emerald-600" : trend < 0 ? "text-red-500" : "text-muted-foreground"
                )}
                aria-label={`${trend > 0 ? "Increased" : trend < 0 ? "Decreased" : "No change"} by ${Math.abs(trend)}%`}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" aria-hidden="true" />
                ) : null}
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
