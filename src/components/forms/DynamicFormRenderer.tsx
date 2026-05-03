"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import type { IForm, IFormField } from "@/types";

interface DynamicFormProps {
  form: Pick<IForm, "_id" | "title" | "description" | "fields" | "settings">;
  onSuccess?: () => void;
}

export default function DynamicFormRenderer({ form, onSuccess }: DynamicFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setValue = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => { const next = { ...prev }; delete next[fieldId]; return next; });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of form.fields) {
      const value = formData[field.id];
      const isEmpty = value === undefined || value === null || value === "";

      if (field.required && isEmpty) {
        newErrors[field.id] = `${field.label} is required`;
        continue;
      }

      if (!isEmpty) {
        if (field.type === "number" && field.validation) {
          const num = Number(value);
          if (isNaN(num)) { newErrors[field.id] = "Must be a number"; continue; }
          if (field.validation.min !== undefined && num < field.validation.min) {
            newErrors[field.id] = `Must be at least ${field.validation.min}`;
          }
          if (field.validation.max !== undefined && num > field.validation.max) {
            newErrors[field.id] = `Must be at most ${field.validation.max}`;
          }
        }
        if (field.type === "email" && typeof value === "string") {
          if (!/^\S+@\S+\.\S+$/.test(value)) {
            newErrors[field.id] = "Enter a valid email address";
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: String(form._id), data: formData }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Submission failed");

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Submitted Successfully!</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {form.settings.successMessage}
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => {
              setSubmitted(false);
              setFormData({});
            }}
          >
            Submit Another Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {form.fields
            .sort((a, b) => a.order - b.order)
            .map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                value={formData[field.id]}
                error={errors[field.id]}
                onChange={(val) => setValue(field.id, val)}
              />
            ))}

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Individual Field Renderer ─────────────────────────────────────────────

interface DynamicFieldProps {
  field: IFormField;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
}

function DynamicField({ field, value, error, onChange }: DynamicFieldProps) {
  const id = `field-${field.id}`;
  const isRequired = field.required;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {field.label}
        {isRequired && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </Label>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}

      {(field.type === "text" || field.type === "email" || field.type === "phone") && (
        <Input
          id={id}
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          required={isRequired}
        />
      )}

      {field.type === "number" && (
        <Input
          id={id}
          type="number"
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          min={field.validation?.min}
          max={field.validation?.max}
          aria-invalid={!!error}
          required={isRequired}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          id={id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="resize-none"
          aria-invalid={!!error}
          required={isRequired}
        />
      )}

      {field.type === "date" && (
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          required={isRequired}
        />
      )}

      {field.type === "dropdown" && (
        <Select
          value={(value as string) ?? ""}
          onValueChange={onChange}
        >
          <SelectTrigger aria-invalid={!!error} id={id}>
            <SelectValue placeholder={field.placeholder ?? "Select an option..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="space-y-2">
          {(field.options ?? []).map((opt) => {
            const checked = Array.isArray(value)
              ? (value as string[]).includes(opt)
              : false;
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`${id}-${opt}`}
                  checked={checked}
                  onCheckedChange={(ch) => {
                    const current = Array.isArray(value) ? (value as string[]) : [];
                    onChange(
                      ch ? [...current, opt] : current.filter((v) => v !== opt)
                    );
                  }}
                />
                <Label htmlFor={`${id}-${opt}`} className="text-sm font-normal cursor-pointer">
                  {opt}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
