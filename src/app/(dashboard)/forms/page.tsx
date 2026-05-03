import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import { canManageForms } from "@/lib/auth/jwt";
import { getForms } from "@/services/formService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, ClipboardList, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = { title: "Forms" };

export default async function FormsPage() {
  const session = await getSession();
  const { forms } = await getForms(session!.organizationId, { limit: 50 }).catch(
    () => ({ forms: [], total: 0, page: 1, limit: 50 })
  );
  const canManage = canManageForms(session!.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forms</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {forms.length} form{forms.length !== 1 ? "s" : ""} available
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link href="/forms/builder">
              <Plus className="mr-2 h-4 w-4" /> New Form
            </Link>
          </Button>
        )}
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-medium mb-1">No forms yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first inspection form to get started
            </p>
            {canManage && (
              <Button asChild size="sm">
                <Link href="/forms/builder">
                  <Plus className="mr-2 h-4 w-4" /> Create Form
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.map((form: any) => (
            <Card key={String(form._id)} className="group hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{form.title}</h3>
                    {form.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={form.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                    {form.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3" />
                    {form.fields?.length ?? 0} fields
                    {form.siteId?.name && (
                      <span className="ml-auto">📍 {form.siteId.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ClipboardList className="h-3 w-3" />
                    {form.submissionCount ?? 0} submissions
                    <span className="ml-auto">
                      v{form.version}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Link href={`/forms/${form._id}`}>
                      <FileText className="mr-1.5 h-3 w-3" /> Fill
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Link href={`/submissions?formId=${form._id}`}>
                      <ClipboardList className="mr-1.5 h-3 w-3" /> Submissions
                    </Link>
                  </Button>
                  {canManage && (
                    <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Link href={`/forms/${form._id}`} aria-label="Edit form">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  Updated {formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
