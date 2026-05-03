import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";

export const metadata: Metadata = {
  title: "Authentication",
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4">
            FO
          </div>
          <h1 className="text-2xl font-bold text-foreground">Field Ops Platform</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Field Operations & Inspection Management
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
