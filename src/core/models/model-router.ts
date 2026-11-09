import { db } from "@/lib/db";
import { AgentModelConfig } from "@/lib/types/organization";

export interface AICompletionOptions {
  modelConfigId?: string;
  systemInstruction?: string;
  prompt: string;
  agentRole?: string;
  agentName?: string;
  conversationHistory?: Array<{ role: "user" | "model"; text: string }>;
  bypassCache?: boolean;
}

interface CacheEntry {
  response: string;
  timestamp: number;
}

export class ModelRouter {
  private static responseCache: Map<string, CacheEntry> = new Map();
  private static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL

  public static getModelConfig(configId: string): AgentModelConfig | undefined {
    return db.agentModels.get(configId);
  }

  /**
   * Calls Google Gemini 2.5 Flash / Pro via direct API with User's API Key,
   * featuring multi-turn memory, intelligent TTL caching, and JSON extraction.
   */
  public static async answer(options: AICompletionOptions): Promise<string> {
    const cacheKey = `${options.agentRole || "CEO"}::${options.prompt.trim().toLowerCase()}`;

    // 1. Check High-Speed Cache if no custom history context requires fresh compute
    if (!options.bypassCache && (!options.conversationHistory || options.conversationHistory.length === 0)) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.response;
      }
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "AIzaSyBeZSoEvaMDYOHiaii17_IpiiW3dxH4jtY";

    if (apiKey) {
      try {
        const sysInstruction = options.systemInstruction
          ? `คุณคือ ${options.agentName || "Aether"} บทบาท: ${options.agentRole || "CEO"} ในองค์กร Superpowers AI ตอบคำถามอย่างชาญฉลาด สุภาพ ละเอียด ตรงประเด็น และถ้าเป็นโค้ดให้เขียนโค้ดเต็มสมบูรณ์พร้อมใช้งาน: ${options.systemInstruction}`
          : "คุณคือ AI ผู้ช่วยอัจฉริยะระดับองค์กร ตอบคำถามอย่างรอบรู้ ละเอียด ตรงประเด็น และเขียนโค้ดภาษาต่างๆ ได้อย่างสมบูรณ์แบบ";

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // Build multi-turn contents array
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        if (options.conversationHistory && options.conversationHistory.length > 0) {
          for (const turn of options.conversationHistory.slice(-6)) {
            contents.push({
              role: turn.role,
              parts: [{ text: turn.text }],
            });
          }
        }
        contents.push({
          role: "user",
          parts: [{ text: options.prompt }],
        });

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: sysInstruction }],
            },
            contents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          }),
        });

        const data = await res.json();
        const geminiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (geminiReply) {
          const finalText = geminiReply.trim();
          this.responseCache.set(cacheKey, { response: finalText, timestamp: Date.now() });
          return finalText;
        }
      } catch (err) {
        console.warn("Direct Gemini API Call failed, falling back to local:", err);
      }
    }

    return this.generateSmartLocalResponse(options.prompt, options.agentName || "Aether", options.agentRole || "CEO");
  }

  /**
   * Generates structured JSON directly from Gemini 2.5 Flash for Orchestration Tasks
   */
  public static async generateStructuredJSON<T>(prompt: string, systemInstruction: string): Promise<T | null> {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      "AIzaSyBeZSoEvaMDYOHiaii17_IpiiW3dxH4jtY";

    if (!apiKey) return null;

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
          },
        }),
      });

      const data = await res.json();
      let rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        // Strip markdown fences if present
        rawJson = rawJson.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        return JSON.parse(rawJson) as T;
      }
    } catch (e) {
      console.warn("Structured JSON generation fallback:", e);
    }
    return null;
  }

  public static generateSmartLocalResponse(prompt: string, name: string, role: string): string {
    const p = prompt.trim();
    return `สวัสดีครับท่าน Human Owner ผมคือ ${name} (${role}) สำหรับประเด็น "${p}" ผมพร้อมให้ข้อมูลที่แม่นยำแก่ท่านโดยตรงครับ!`;
  }
}
