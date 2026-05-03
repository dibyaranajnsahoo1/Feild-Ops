import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
      db: "connected",
    });
  } catch {
    return NextResponse.json(
      { status: "unhealthy", db: "disconnected" },
      { status: 503 }
    );
  }
}
