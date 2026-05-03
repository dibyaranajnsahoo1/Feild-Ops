import connectDB from "@/lib/db/connect";
import User from "@/models/User";
import Organization from "@/models/Organization";
import { signToken, setAuthCookie } from "@/lib/auth/jwt";
import { LoginSchema, RegisterSchema } from "@/lib/validations/schemas";
import type { LoginInput, RegisterInput } from "@/lib/validations/schemas";

// ─── Login ─────────────────────────────────────────────────────────────────

export async function loginUser(input: LoginInput) {
  const validated = LoginSchema.parse(input);
  await connectDB();

  const user = await User.findOne({ email: validated.email.toLowerCase(), isActive: true })
    .select("+password");

  if (!user || !(await user.comparePassword(validated.password))) {
    throw new Error("Invalid email or password");
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  const token = await signToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: String(user.organizationId),
  });

  setAuthCookie(token);

  return {
    token,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: String(user.organizationId),
    },
  };
}

// ─── Register ──────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput) {
  const validated = RegisterSchema.parse(input);
  await connectDB();

  // Check for existing email
  const existing = await User.findOne({ email: validated.email }).lean();
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  // Create organization
  const slug =
    validated.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50) +
    "-" +
    Date.now().toString(36);

  const organization = await Organization.create({
    name: validated.organizationName,
    slug,
  });

  // Create admin user
  const user = await User.create({
    name: validated.name,
    email: validated.email,
    password: validated.password,
    role: "admin",
    organizationId: organization._id,
  });

  const token = await signToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: String(organization._id),
  });

  setAuthCookie(token);

  return {
    token,
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: String(organization._id),
    },
  };
}
