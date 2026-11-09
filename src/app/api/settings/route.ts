import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";

const SettingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
});

export async function GET() {
  const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  return NextResponse.json({
    providers: {
      gemini: {
        configured: hasGemini,
        maskedKey: hasGemini ? "AIzaSy..." + (process.env.GEMINI_API_KEY || "").slice(-4) : null,
      },
      openai: {
        configured: hasOpenAI,
        maskedKey: hasOpenAI ? "sk-..." + (process.env.OPENAI_API_KEY || "").slice(-4) : null,
      },
      anthropic: {
        configured: hasAnthropic,
        maskedKey: hasAnthropic ? "sk-ant-..." + (process.env.ANTHROPIC_API_KEY || "").slice(-4) : null,
      },
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { geminiApiKey, openaiApiKey, anthropicApiKey } = parsed.data;
    const envPath = path.join(process.cwd(), ".env.local");

    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

    const updateOrAppend = (key: string, val?: string) => {
      if (!val) return;
      process.env[key] = val;
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${val}`);
      } else {
        envContent += `\n${key}=${val}`;
      }
    };

    if (geminiApiKey) {
      updateOrAppend("GEMINI_API_KEY", geminiApiKey);
      updateOrAppend("GOOGLE_GENERATIVE_AI_API_KEY", geminiApiKey);
    }
    if (openaiApiKey) updateOrAppend("OPENAI_API_KEY", openaiApiKey);
    if (anthropicApiKey) updateOrAppend("ANTHROPIC_API_KEY", anthropicApiKey);

    fs.writeFileSync(envPath, envContent.trim() + "\n", "utf8");

    return NextResponse.json({
      success: true,
      message: "API Keys saved securely to server-side .env.local",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update settings", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
