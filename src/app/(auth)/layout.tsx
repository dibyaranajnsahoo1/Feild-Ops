import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";

export const metadata: Metadata = {
  title: "Authentication",
};

import Footer from "@/components/layout/Footer";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center py-12">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4 shadow-lg">
            FO
          </div>
          <h1 className="text-2xl font-bold text-foreground">Field Ops Platform</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Field Operations & Inspection Management
          </p>
        </div>
        {children}
      </div>
      <div className="w-full max-w-md mt-auto">
        <Footer />
      </div>
    </div>
  );
}
