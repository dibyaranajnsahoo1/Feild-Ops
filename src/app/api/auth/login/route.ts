import { NextRequest } from "next/server";
import { loginUser } from "@/services/authService";
import { apiSuccess, apiError, rateLimit } from "@/middleware/api";
import { LoginSchema } from "@/lib/validations/schemas";
import { ZodError } from "zod";

const limiter = rateLimit(10, 15 * 60 * 1000); // 10 requests per 15min

export async function POST(req: NextRequest) {
  // Rate limit auth endpoints aggressively
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const validated = LoginSchema.parse(body);
    const result = await loginUser(validated);
    return apiSuccess(result, 200, "Login successful");
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(error.errors[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return apiError(error.message, 401);
    }
    return apiError("Login failed", 500);
  }
}
