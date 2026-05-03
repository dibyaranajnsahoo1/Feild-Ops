"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFormSchema, type CreateFormInput } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import FieldEditor from "@/components/forms/FieldEditor";
import FieldPalette from "@/components/forms/FieldPalette";
import { Loader2, Plus, Save, Eye } from "lucide-react";
import { nanoid } from "nanoid";
import type { IFormField, FieldType } from "@/types";

interface FormBuilderProps {
  sites: { _id: string; name: string }[];
  initialForm?: Partial<CreateFormInput> & { _id?: string };
}

export default function FormBuilder({ sites, initialForm }: FormBuilderProps) {
  const router = useRouter();
  const [fields, setFields] = useState<IFormField[]>(
    (initialForm?.fields as IFormField[]) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateFormInput>({
    resolver: zodResolver(CreateFormSchema),
    defaultValues: {
      title: initialForm?.title ?? "",
      description: initialForm?.description ?? "",
      siteId: initialForm?.siteId ?? "",
      fields: initialForm?.fields ?? [],
      settings: {
        allowMultipleSubmissions: true,
        requiresApproval: false,
        notifyOnSubmission: false,
        successMessage: "Thank you! Your submission has been recorded.",
        ...initialForm?.settings,
      },
    },
  });

  const addField = useCallback((type: FieldType) => {
    const newField: IFormField = {
      id: nanoid(8),
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      order: fields.length,
      ...(type === "dropdown" || type === "checkbox" ? { options: ["Option 1", "Option 2"] } : {}),
    };
    const updated = [...fields, newField];
    setFields(updated);
    setValue("fields", updated as any);
    setEditingFieldId(newField.id);
  }, [fields, setValue]);

  const updateField = useCallback((id: string, updates: Partial<IFormField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFields(updated);
    setValue("fields", updated as any);
  }, [fields, setValue]);

  const removeField = useCallback((id: string) => {
    const updated = fields
      .filter((f) => f.id !== id)
      .map((f, i) => ({ ...f, order: i }));
    setFields(updated);
    setValue("fields", updated as any);
    if (editingFieldId === id) setEditingFieldId(null);
  }, [fields, setValue, editingFieldId]);

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...fields];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved!);
    const reordered = updated.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    setValue("fields", reordered as any);
  }, [fields, setValue]);

  const onSubmit = async (data: CreateFormInput) => {
    if (fields.length === 0) {
      setError("Please add at least one field to your form");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload = { ...data, fields };
      const url = initialForm?._id ? `/api/forms/${initialForm._id}` : "/api/forms";
      const method = initialForm?._id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save form");
      router.push("/forms");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const watchRequiresApproval = watch("settings.requiresApproval");
  const watchAllowMultiple = watch("settings.allowMultipleSubmissions");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Field Palette */}
      <div className="lg:col-span-1">
        <FieldPalette onAddField={addField} />
      </div>

      {/* Center: Form Canvas */}
      <div className="lg:col-span-2 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Meta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Form Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Daily Safety Inspection"
                {...register("title")}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose of this form..."
                {...register("description")}
                className="mt-1 resize-none"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="siteId">Site *</Label>
              <Select
                onValueChange={(val) => setValue("siteId", val)}
                defaultValue={initialForm?.siteId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId && (
                <p className="text-xs text-destructive mt-1">{errors.siteId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Field Canvas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Form Fields ({fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg text-center">
                <Plus className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add fields from the palette on the left
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fields
                  .sort((a, b) => a.order - b.order)
                  .map((field, index) => (
                    <FieldEditor
                      key={field.id}
                      field={field}
                      index={index}
                      totalFields={fields.length}
                      isEditing={editingFieldId === field.id}
                      onEdit={() =>
                        setEditingFieldId(
                          editingFieldId === field.id ? null : field.id
                        )
                      }
                      onUpdate={(updates) => updateField(field.id, updates)}
                      onRemove={() => removeField(field.id)}
                      onMoveUp={() => index > 0 && moveField(index, index - 1)}
                      onMoveDown={() =>
                        index < fields.length - 1 && moveField(index, index + 1)
                      }
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> {initialForm?._id ? "Update Form" : "Publish Form"}</>
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push("/forms")}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Right: Settings */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Form Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Multiple Submissions</Label>
                <p className="text-xs text-muted-foreground">Allow re-submission</p>
              </div>
              <Switch
                checked={watchAllowMultiple}
                onCheckedChange={(val) => setValue("settings.allowMultipleSubmissions", val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Requires Approval</Label>
                <p className="text-xs text-muted-foreground">Manager must review</p>
              </div>
              <Switch
                checked={watchRequiresApproval}
                onCheckedChange={(val) => setValue("settings.requiresApproval", val)}
              />
            </div>

            <div>
              <Label className="text-sm" htmlFor="successMsg">Success Message</Label>
              <Textarea
                id="successMsg"
                {...register("settings.successMessage")}
                className="mt-1 resize-none text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Field Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">No fields added yet</p>
            ) : (
              <ul className="space-y-1">
                {fields.map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-foreground">{f.label}</span>
                    <span className="text-muted-foreground ml-2 flex-shrink-0 capitalize">{f.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
