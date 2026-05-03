import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, BarChart3, MapPin } from "lucide-react";
import type { Role } from "@/types";
import { canManageForms, canViewAnalytics } from "@/lib/auth/jwt";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  role: Role;
  className?: string;
}

export default function QuickActions({ role, className }: QuickActionsProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {canManageForms(role) && (
          <Button asChild variant="outline" className="w-full justify-start gap-2 h-9" size="sm">
            <Link href="/forms/builder">
              <PlusCircle className="h-4 w-4 text-primary" />
              Create New Form
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full justify-start gap-2 h-9" size="sm">
          <Link href="/submissions">
            <ClipboardList className="h-4 w-4 text-primary" />
            View Submissions
          </Link>
        </Button>
        {canViewAnalytics(role) && (
          <Button asChild variant="outline" className="w-full justify-start gap-2 h-9" size="sm">
            <Link href="/analytics">
              <BarChart3 className="h-4 w-4 text-primary" />
              View Analytics
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full justify-start gap-2 h-9" size="sm">
          <Link href="/sites">
            <MapPin className="h-4 w-4 text-primary" />
            Manage Sites
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
