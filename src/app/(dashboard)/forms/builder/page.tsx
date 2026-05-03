import type { Metadata } from "next";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";
import { canManageForms } from "@/lib/auth/jwt";
import connectDB from "@/lib/db/connect";
import Site from "@/models/Site";
import FormBuilder from "@/components/forms/FormBuilder";

export const metadata: Metadata = { title: "Form Builder" };

export default async function FormBuilderPage() {
  const session = await getSession();
  if (!session || !canManageForms(session.role)) redirect("/dashboard");

  await connectDB();
  const sites = await Site.find({
    organizationId: session.organizationId,
    isActive: true,
  })
    .select("name _id")
    .sort({ name: 1 })
    .lean();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Design dynamic inspection forms for your field staff
        </p>
      </div>
      <FormBuilder
        sites={sites.map((s) => ({ _id: String(s._id), name: s.name }))}
      />
    </div>
  );
}
