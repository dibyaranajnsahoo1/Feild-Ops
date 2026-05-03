/**
 * Unit tests for Zod validation schemas
 */
import {
  LoginSchema,
  RegisterSchema,
  CreateFormSchema,
  CreateSubmissionSchema,
  FormFieldSchema,
} from "@/lib/validations/schemas";

describe("LoginSchema", () => {
  it("validates a correct login payload", () => {
    const result = LoginSchema.safeParse({
      email: "admin@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = LoginSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/invalid/i);
  });

  it("lowercases the email", () => {
    const result = LoginSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("user@example.com");
  });
});

describe("RegisterSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@acme.com",
    password: "Secure@123",
    organizationName: "Acme Corp",
  };

  it("validates correct registration data", () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects weak passwords (no uppercase)", () => {
    const result = RegisterSchema.safeParse({ ...valid, password: "weakpassword1!" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/uppercase/i);
  });

  it("rejects password without special character", () => {
    const result = RegisterSchema.safeParse({ ...valid, password: "WeakPass1" });
    expect(result.success).toBe(false);
  });

  it("rejects passwords shorter than 8 chars", () => {
    const result = RegisterSchema.safeParse({ ...valid, password: "Sh@rt1" });
    expect(result.success).toBe(false);
  });
});

describe("FormFieldSchema", () => {
  const validField = {
    id: "field-001",
    type: "text",
    label: "Inspector Name",
    required: true,
    order: 0,
  };

  it("validates a basic text field", () => {
    expect(FormFieldSchema.safeParse(validField).success).toBe(true);
  });

  it("validates dropdown field with options", () => {
    const result = FormFieldSchema.safeParse({
      ...validField,
      type: "dropdown",
      options: ["Option A", "Option B"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown field types", () => {
    const result = FormFieldSchema.safeParse({ ...validField, type: "unknown_type" });
    expect(result.success).toBe(false);
  });

  it("rejects empty labels", () => {
    const result = FormFieldSchema.safeParse({ ...validField, label: "" });
    expect(result.success).toBe(false);
  });
});

describe("CreateFormSchema", () => {
  const validForm = {
    title: "Daily Safety Check",
    siteId: "site-abc-123",
    fields: [
      { id: "f1", type: "text", label: "Inspector", required: true, order: 0 },
    ],
  };

  it("validates a complete form", () => {
    expect(CreateFormSchema.safeParse(validForm).success).toBe(true);
  });

  it("rejects forms with no fields", () => {
    const result = CreateFormSchema.safeParse({ ...validForm, fields: [] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/at least one field/i);
  });

  it("rejects form without siteId", () => {
    const result = CreateFormSchema.safeParse({ ...validForm, siteId: "" });
    expect(result.success).toBe(false);
  });
});

describe("CreateSubmissionSchema", () => {
  it("validates a submission with form data", () => {
    const result = CreateSubmissionSchema.safeParse({
      formId: "form-xyz-123",
      data: { "field-1": "John Doe", "field-2": 42 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing formId", () => {
    const result = CreateSubmissionSchema.safeParse({ data: {} });
    expect(result.success).toBe(false);
  });
});
