import { NextRequest } from "next/server";
import { withAuth, apiSuccess, apiError, rateLimit } from "@/middleware/api";
import { generateSiteInsights } from "@/lib/ai/aiService";
import connectDB from "@/lib/db/connect";
import Submission from "@/models/Submission";
import Site from "@/models/Site";
import Form from "@/models/Form";

const limiter = rateLimit(20, 60 * 60 * 1000); // 20 AI calls/hour

// POST /api/ai/insights
export const POST = withAuth(async (req, session) => {
  const limited = limiter(req);
  if (limited) return limited;

  try {
    const { siteId } = await req.json() as { siteId?: string };

    await connectDB();

    const siteFilter: Record<string, unknown> = { organizationId: session.organizationId };
    if (siteId) siteFilter["_id"] = siteId;

    const [site, forms, submissions] = await Promise.all([
      Site.findOne(siteFilter).lean(),
      Form.find({ organizationId: session.organizationId, ...(siteId && { siteId }) })
        .select("title")
        .lean(),
      Submission.find({
        organizationId: session.organizationId,
        ...(siteId && { siteId }),
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .select("data status createdAt aiSummary")
        .lean(),
    ]);

    if (!site && siteId) return apiError("Site not found", 404);

    const result = await generateSiteInsights(
      site?.name ?? "All Sites",
      submissions.map((s) => ({
        data: s.data as Record<string, unknown>,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        aiSummary: s.aiSummary,
      })),
      forms.map((f) => f.title)
    );

    return apiSuccess(result);
  } catch {
    return apiError("AI analysis failed", 500);
  }
}, "manager");
