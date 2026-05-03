import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth/jwt";
import { canManageSites } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connect";
import Site from "@/models/Site";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Users } from "lucide-react";
import CreateSiteDialog from "@/components/sites/CreateSiteDialog";

export const metadata: Metadata = { title: "Sites" };

export default async function SitesPage() {
  const session = await getSession();
  const canManage = canManageSites(session!.role);

  await connectDB();
  const sites = await Site.find({
    organizationId: session!.organizationId,
    isActive: true,
  })
    .populate("managerId", "name email")
    .sort({ name: 1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sites.length} active site{sites.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && <CreateSiteDialog />}
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-medium mb-1">No sites yet</h3>
            <p className="text-sm text-muted-foreground">
              Add sites where field operations take place
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map((site: any) => (
            <Card key={String(site._id)} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{site.name}</h3>
                    {site.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {site.description}
                      </p>
                    )}
                    {site.location?.city && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {[site.location.city, site.location.state, site.location.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {site.managerId && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {site.managerId.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Link href={`/submissions?siteId=${site._id}`}>View Submissions</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
                    <Link href={`/forms?siteId=${site._id}`}>Forms</Link>
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
