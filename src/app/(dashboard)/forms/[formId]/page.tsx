import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { getFormById } from "@/services/formService";
import DynamicFormRenderer from "@/components/forms/DynamicFormRenderer";

export async function generateMetadata({ params }: { params: { formId: string } }): Promise<Metadata> {
  return {
    title: `Fill Form - ${params.formId}`,
  };
}

export default async function FormFillPage({ params }: { params: { formId: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const form = await getFormById(params.formId, session.organizationId);
  if (!form) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fill Form</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete the form below and submit your response.
        </p>
      </div>

      <DynamicFormRenderer
        form={form as any}
      />
    </div>
  );
}
