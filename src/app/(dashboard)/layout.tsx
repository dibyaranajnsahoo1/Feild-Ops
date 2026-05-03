import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar session={session} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar session={session} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 scrollbar-thin"
          role="main"
          aria-label="Main content"
        >
          <div className="max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
