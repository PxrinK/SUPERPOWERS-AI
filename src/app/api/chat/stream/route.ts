import { AgentManager } from "@/core/organization/org-manager";
import { CommunicationBus } from "@/core/communications/comm-bus";
import { ModelRouter } from "@/core/models/model-router";

export async function POST(req: Request) {
  try {
    const { agentId, message, conversationHistory } = await req.json();
    const apiKey = ModelRouter.getApiKey();

    const targetAgent = AgentManager.getAgent(agentId) || {
      name: "Aether",
      role: "CEO",
      systemInstructions: "You are CEO Aether in Superpowers AI.",
    };

    const sysInstruction = `คุณคือ ${targetAgent.name} (${targetAgent.role}) ผู้ช่วย AI อัจฉริยะสารพัดประโยชน์และที่ปรึกษาองค์กร Superpowers AI
คุณมีความสามารถรอบด้านและตอบสนองได้ทุกความต้องการของ Human Owner:
1. ด้านการสร้างสรรค์ & ไลฟ์สไตล์: ขอสูตรอาหาร, แต่งเพลง, แต่งกลอน, คิดคำคม, แคปชั่น, เขียนบทความ, แปลภาษา, ตอบคำถามความรู้รอบตัวทั่วไปได้อย่างแม่นยำ ละเอียด ไพเราะ และเป็นธรรมชาติ
2. ด้านธุรกิจ & การคิดงาน: ช่วยระดมสมอง (Brainstorming), วางกลยุทธ์, คิดไอเดียผลิตภัณฑ์, วางแผนการตลาด
3. ด้านเทคนิค & วิศวกรรม: ออกแบบระบบ, วางสถาปัตยกรรม, เขียนโค้ดโปรแกรมฉบับเต็มสมบูรณ์พร้อมใช้งาน
ให้ปรับน้ำเสียงและสไตล์การตอบตามโจทย์ของผู้ใช้อย่างเหมาะสมที่สุดเสมอ`;

    const candidateModels = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash"];

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (conversationHistory && conversationHistory.length > 0) {
      for (const turn of conversationHistory.slice(-6)) {
        contents.push({
          role: turn.role,
          parts: [{ text: turn.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    let geminiRes: Response | null = null;
    if (apiKey) {
      for (const model of candidateModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
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

          if (res.ok && res.body) {
            geminiRes = res;
            break;
          } else {
            console.warn(`Gemini stream (${model}) responded with status ${res.status}`);
          }
        } catch (fetchErr) {
          console.warn(`Gemini stream (${model}) fetch error:`, fetchErr);
        }
      }
    }

    // RESILIENT FALLBACK: If Gemini API is momentarily offline, rate-limited, leaked key, or network error
    if (!geminiRes || !geminiRes.ok || !geminiRes.body) {
      console.warn("Gemini stream unavailable, falling back to smart local responder");
      const fallbackAnswer = ModelRouter.generateSmartLocalResponse(message, targetAgent.name, targetAgent.role);

      const encoder = new TextEncoder();
      const fallbackStream = new ReadableStream({
        start(controller) {
          // Stream the fallback text smoothly
          const words = fallbackAnswer.split(" ");
          let i = 0;
          const interval = setInterval(() => {
            if (i < words.length) {
              controller.enqueue(encoder.encode((i > 0 ? " " : "") + words[i]));
              i++;
            } else {
              clearInterval(interval);
              controller.close();
            }
          }, 20);
        },
      });

      return new Response(fallbackStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // Transform Gemini SSE stream to direct text chunks for frontend
    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let fullAnswer = "";

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            CommunicationBus.sendMessage({
              projectId: "stream-chat",
              taskId: null,
              senderAgentId: agentId,
              receiverAgentId: "HUMAN_OWNER",
              messageType: "FINDING",
              content: fullAnswer,
              metadata: { channel: "STREAM_CHAT" },
            });
            return;
          }

          const rawChunk = decoder.decode(value, { stream: true });
          const lines = rawChunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    fullAnswer += text;
                    controller.enqueue(encoder.encode(text));
                  }
                }
              } catch (e) {
                // Ignore parsing incomplete chunk
              }
            }
          }
        } catch (err: any) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return new Response(`Stream error: ${err.message}`, { status: 500 });
  }
}
