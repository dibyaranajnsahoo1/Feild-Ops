import type { Metadata } from "next";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, UserCheck, User as UserIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import InviteUserDialog from "@/components/users/InviteUserDialog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

const ROLE_ICONS = {
  super_admin: ShieldCheck,
  admin: ShieldCheck,
  manager: UserCheck,
  staff: UserIcon,
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  manager: "bg-emerald-100 text-emerald-700",
  staff: "bg-slate-100 text-slate-700",
};

export default async function UsersPage() {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) redirect("/dashboard");

  await connectDB();
  const users = await User.find({ organizationId: session.organizationId })
    .select("-password")
    .sort({ name: 1 })
    .lean();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {users.length} member{users.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user: any) => {
          const RoleIcon = ROLE_ICONS[user.role as keyof typeof ROLE_ICONS] ?? UserIcon;
          return (
            <Card key={String(user._id)} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{user.name}</h3>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-medium capitalize flex items-center gap-1",
                        ROLE_COLORS[user.role]
                      )}>
                        <RoleIcon className="h-2.5 w-2.5" />
                        {user.role.replace("_", " ")}
                      </span>
                      {!user.isActive && (
                        <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                    {user.lastLoginAt && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Last login: {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
