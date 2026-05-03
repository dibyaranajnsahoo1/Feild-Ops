import type { Metadata } from "next";
import { getSession } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, User as UserIcon, Database } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getSession();
  await connectDB();

  const [user, org] = await Promise.all([
    User.findById(session!.sub).select("-password").lean(),
    Organization.findById(session!.organizationId).lean(),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Account and organization information
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Role", value: user?.role?.replace("_", " ") },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium capitalize">{value ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" /> Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Name", value: (org as any)?.name },
            { label: "Slug", value: (org as any)?.slug },
            { label: "Plan", value: (org as any)?.plan },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium capitalize">{value ?? "—"}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Plan Limits
          </CardTitle>
          <CardDescription>
            Current usage limits for your plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Max Users", value: (org as any)?.settings?.maxUsers ?? 10 },
              { label: "Max Sites", value: (org as any)?.settings?.maxSites ?? 5 },
              { label: "Max Forms", value: (org as any)?.settings?.maxForms ?? 20 },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5">
                <span className="text-muted-foreground">{label}</span>
                <Badge variant="outline">{value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Passwords hashed with bcrypt (cost factor 12)</p>
          <p>✅ JWT stored in httpOnly secure cookies</p>
          <p>✅ Rate limiting active on all auth endpoints</p>
          <p>✅ All inputs validated with Zod schemas</p>
          <p>✅ MongoDB injection prevention active</p>
          <p>✅ CSRF protection via SameSite cookies</p>
        </CardContent>
      </Card>
    </div>
  );
}
