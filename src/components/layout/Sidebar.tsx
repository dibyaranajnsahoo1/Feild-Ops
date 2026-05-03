"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  BarChart3,
  MapPin,
  Users,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import type { JWTPayload } from "@/lib/auth/jwt";
// import { canManageForms, canViewAnalytics, canManageUsers } from "@/lib/auth/jwt";
import { useState } from "react";
import type { Role } from "@/lib/auth/permissions";
import { canManageForms, canViewAnalytics, canManageUsers } from "@/lib/auth/permissions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  requiredFn?: (role: Role) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/forms", label: "Forms", icon: FileText, requiredFn: canManageForms },
  { href: "/submissions", label: "Submissions", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart3, requiredFn: canViewAnalytics },
  { href: "/sites", label: "Sites", icon: MapPin },
  { href: "/users", label: "Users", icon: Users, requiredFn: canManageUsers },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  session: {
    role: Role;
  };
}

export default function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const allowedItems = NAV_ITEMS.filter(
    (item) => !item.requiredFn || item.requiredFn(session.role)
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-900 text-slate-100 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      aria-label="Main navigation"
    >
      {/* Brand */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-slate-800",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-xs font-bold">
          FO
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold truncate">Field Ops</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Sidebar navigation">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800",
                collapsed && "justify-center px-2"
              )}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="h-3 w-3" />
            <span className="capitalize">{session.role.replace("_", " ")}</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <div className="flex items-center gap-2 text-xs px-4">
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </div>
        )}
      </button>
    </aside>
  );
}
