import { NextRequest } from "next/server";
import { registerUser } from "@/services/authService";
import { apiSuccess, apiError, rateLimit } from "@/middleware/api";
import { RegisterSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

const limiter = rateLimit(5, 60 * 60 * 1000); // 5 registrations per hour

export async function POST(req: NextRequest) {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);
    const result = await registerUser(validated);
    return apiSuccess(result, 201, "Account created successfully");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return apiError(error.message, 400);
    }
    return apiError("Registration failed", 500);
  }
}
