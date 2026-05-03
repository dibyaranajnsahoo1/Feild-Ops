/**
 * AI Service using OpenRouter (OpenAI-compatible API).
 * Provides submission analysis, anomaly detection, and site-level insights.
 */
import OpenAI from "openai";
import type { AIAnalysisResult, IForm, ISubmission } from "@/types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Field Ops Platform",
  },
});

const MODEL = process.env.OPENAI_MODEL ?? "openai/gpt-4.1-mini";
const MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS ?? "1200", 10);

// ─── Submission Analysis ───────────────────────────────────────────────────

export async function analyzeSubmission(
  submission: Pick<ISubmission, "data" | "createdAt">,
  form: Pick<IForm, "title" | "fields">
): Promise<{ summary: string; anomalies: string[] }> {
  const fieldMap = Object.fromEntries(
    form.fields.map((f) => [f.id, f.label])
  );

  const readableData = Object.entries(submission.data)
    .map(([key, val]) => `${fieldMap[key] ?? key}: ${String(val)}`)
    .join("\n");

  const prompt = `You are an expert field operations analyst. Analyze this form submission and provide:
1. A concise 2-3 sentence summary of what was reported
2. Any anomalies, concerns, or items requiring attention

Form: "${form.title}"
Submitted: ${new Date(submission.createdAt).toLocaleDateString()}

Submission Data:
${readableData}

Respond in JSON format:
{
  "summary": "...",
  "anomalies": ["anomaly1", "anomaly2"]
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { summary?: string; anomalies?: string[] };

    return {
      summary: parsed.summary ?? "No summary generated.",
      anomalies: parsed.anomalies ?? [],
    };
  } catch (error) {
    console.error("AI submission analysis failed:", error);
    return {
      summary: "AI analysis unavailable at this time.",
      anomalies: [],
    };
  }
}

// ─── Site-Level Insights ───────────────────────────────────────────────────

export async function generateSiteInsights(
  siteName: string,
  submissions: Array<Pick<ISubmission, "data" | "status" | "createdAt" | "aiSummary">>,
  formTitles: string[]
): Promise<AIAnalysisResult> {
  const submissionSummaries = submissions
    .slice(0, 50) // Limit to 50 most recent to avoid token limits
    .map((s, i) => {
      const date = new Date(s.createdAt).toLocaleDateString();
      return `[${i + 1}] ${date} | Status: ${s.status}${s.aiSummary ? ` | ${s.aiSummary}` : ""}`;
    })
    .join("\n");

  const prompt = `You are a senior field operations analyst. Analyze data from site "${siteName}".

Forms in use: ${formTitles.join(", ")}
Total submissions analyzed: ${submissions.length}
Flagged submissions: ${submissions.filter((s) => s.status === "flagged").length}

Recent Submission Summaries:
${submissionSummaries}

Provide a comprehensive analysis in JSON format:
{
  "summary": "2-3 sentence executive summary of site performance and key findings",
  "anomalies": ["list of specific anomalies or concerns detected"],
  "insights": [
    {
      "type": "trend|recommendation|anomaly|summary",
      "content": "specific insight",
      "severity": "low|medium|high",
      "confidence": 0.0-1.0
    }
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as Partial<AIAnalysisResult>;

    return {
      summary: parsed.summary ?? "Analysis complete. No significant issues detected.",
      anomalies: parsed.anomalies ?? [],
      insights: parsed.insights ?? [],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("AI site insights failed:", error);
    return {
      summary: "AI analysis unavailable at this time.",
      anomalies: [],
      insights: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

// ─── Anomaly Detection Across Submissions ─────────────────────────────────

export async function detectAnomalies(
  formTitle: string,
  recentSubmissions: Array<Record<string, unknown>>,
  historicalAvg: Record<string, number>
): Promise<string[]> {
  if (recentSubmissions.length === 0) return [];

  const prompt = `You are a data quality analyst. Detect anomalies in form submissions.

Form: "${formTitle}"
Historical averages: ${JSON.stringify(historicalAvg)}
Recent submissions (last 10): ${JSON.stringify(recentSubmissions.slice(0, 10))}

List specific anomalies as a JSON array of strings. Be specific and actionable.
Example: ["Temperature readings 40% above historical average", "3 submissions missing required safety checks"]

Respond with JSON: { "anomalies": ["..."] }`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { anomalies?: string[] };
    return parsed.anomalies ?? [];
  } catch {
    return [];
  }
}

// ─── Chat with Context ─────────────────────────────────────────────────────

export async function chatWithContext(
  question: string,
  context: {
    siteName: string;
    formTitles: string[];
    recentSummaries: string[];
  }
): Promise<string> {
  const prompt = `You are a helpful field operations assistant for site "${context?.siteName ?? "Unknown"}".

Available forms: ${context.formTitles?.join(", ") ?? "N/A"}
Recent activity summaries:
${context.recentSummaries?.slice(0, 10).join("\n") ?? "No recent data"}

Answer this question concisely and helpfully: ${question}`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    });

    return (
      response.choices[0]?.message?.content ??
      "I couldn't generate a response at this time."
    );
  } catch {
    return "AI assistant is currently unavailable.";
  }
}
