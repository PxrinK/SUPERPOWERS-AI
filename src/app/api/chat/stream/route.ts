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

    const sysInstruction = `คุณคือ ${targetAgent.name} บทบาท: ${targetAgent.role} ในองค์กร Superpowers AI ตอบคำถามอย่างชาญฉลาด สุภาพ มีพลัง ละเอียด ตรงประเด็น และถ้าเป็นโค้ดให้เขียนโค้ดเต็มสมบูรณ์พร้อมใช้งานเสมอ: ${targetAgent.systemInstructions}`;

    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

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
