import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AgentManager } from "@/core/organization/org-manager";
import { CommunicationBus } from "@/core/communications/comm-bus";
import { CEOOrchestrator } from "@/core/orchestrator/ceo-orchestrator";
import { ModelRouter } from "@/core/models/model-router";
import { z } from "zod";

const ChatRequestSchema = z.object({
  agentId: z.string().min(1),
  threadId: z.string().optional().default("thread-default"),
  message: z.string().min(1),
  contextProjectId: z.string().optional().nullable(),
  autoOrchestrate: z.boolean().optional().default(false),
});

/**
 * Checks if the message is a complex corporate directive requiring subtasks & delegation
 */
function isCorporateDirective(msg: string): boolean {
  const directiveKeywords = [
    "สร้างระบบ", "ออกแบบระบบ", "พัฒนาระบบ", "แตกงาน", "วางแผนโปรเจกต์", "จัดทำสถาปัตยกรรม", "ขอ sql", "เขียนโค้ด",
    "สร้างไฟล์", "เขียนไฟล์", "install", "ติดตั้ง", "รัน", "run command",
    "blueprint", "architecture", "build system", "develop system", "execute project", "schema database"
  ];
  const lower = msg.toLowerCase();
  return directiveKeywords.some((kw) => lower.includes(kw));
}

/**
 * GET: Retrieve persistent chat history for a specific agent & threadId
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId") || "agent-ceo-001";
  const threadId = searchParams.get("threadId");

  const allMessages = Array.from(db.messages.values());

  // Filter messages involving HUMAN_OWNER and this agent (and matching threadId if provided)
  const conversation = allMessages
    .filter((m) => {
      const involvesAgent =
        (m.senderAgentId === "HUMAN_OWNER" && m.receiverAgentId === agentId) ||
        (m.senderAgentId === agentId && m.receiverAgentId === "HUMAN_OWNER");
      if (!involvesAgent) return false;
      if (threadId) {
        return (m.metadata?.threadId || "thread-default") === threadId;
      }
      return true;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const mapped = conversation.map((m) => {
    const isUser = m.senderAgentId === "HUMAN_OWNER";
    const agent = AgentManager.getAgent(agentId);
    return {
      sender: isUser ? ("user" as const) : ("agent" as const),
      agentName: isUser ? "Human Owner (You)" : agent?.name || "AI Agent",
      text: m.content,
      time: new Date(m.timestamp).toLocaleTimeString(),
      orchestration: m.metadata?.orchestration || null,
      threadId: m.metadata?.threadId || "thread-default",
    };
  });

  return NextResponse.json({
    agentId,
    threadId: threadId || "thread-default",
    history: mapped,
  });
}

/**
 * POST: Send a message inside a specific topic thread and save to persistent store
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { agentId, threadId, message, contextProjectId } = parsed.data;
    const targetAgent = AgentManager.getAgent(agentId);

    if (!targetAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // 1. Record Owner's message with threadId isolation
    CommunicationBus.sendMessage({
      projectId: contextProjectId || "direct-inquiry",
      taskId: null,
      senderAgentId: "HUMAN_OWNER",
      receiverAgentId: agentId,
      messageType: "QUESTION",
      content: message,
      metadata: {
        channel: "DIRECT_EXECUTIVE_CHAT",
        threadId,
      },
    });

    let agentReply = "";
    let orchestrationResult: any = null;

    // 2. Process query scoped strictly to the current threadId
    if (targetAgent.role === "CEO" && isCorporateDirective(message)) {
      orchestrationResult = await CEOOrchestrator.orchestrateProject({
        ownerGoal: message,
        title: message.length > 50 ? `${message.slice(0, 47)}...` : message,
        priority: "HIGH",
      });

      agentReply = `[CEO Aether]: รับคำสั่งจากท่าน Owner เรียบร้อยครับ! 

ผมได้นำโจทย์เข้าสู่กระบวนการ แตกงานย่อย มอบหมายแผนก และผ่านการตรวจสอบจาก QA เรียบร้อยแล้ว:
- 📊 ระดับความซับซ้อน: ${orchestrationResult.project.complexityScore}/10
- 🏢 แผนกที่ดำเนินการ: Systems Engineering, Research & Analysis, QA
- 📋 งานย่อยที่เสร็จสมบูรณ์: ${orchestrationResult.tasks.length} รายการ

${orchestrationResult.report}

ด้านล่างนี้คือผลลัพธ์และพิมพ์เขียว (Deliverables) ที่ส่งตรงมาให้ท่าน Owner ตรวจดูผลงานขั้นสุดท้ายได้ทันทีครับ 👇`;
    } else {
      // Gather recent conversation history strictly within the SAME threadId for isolated context
      const allMessages = Array.from(db.messages.values());
      const pastConversation = allMessages
        .filter((m) => {
          const involvesAgent =
            (m.senderAgentId === "HUMAN_OWNER" && m.receiverAgentId === agentId) ||
            (m.senderAgentId === agentId && m.receiverAgentId === "HUMAN_OWNER");
          const sameThread = (m.metadata?.threadId || "thread-default") === threadId;
          return involvesAgent && sameThread;
        })
        .slice(-7, -1)
        .map((m) => ({
          role: m.senderAgentId === "HUMAN_OWNER" ? ("user" as const) : ("model" as const),
          text: m.content,
        }));

      const responseText = await ModelRouter.answer({
        prompt: message,
        systemInstruction: targetAgent.systemInstructions,
        agentName: targetAgent.name,
        agentRole: targetAgent.role,
        modelConfigId: targetAgent.modelConfigId,
        conversationHistory: pastConversation,
        bypassCache: pastConversation.length > 0,
      });

      agentReply = `[${targetAgent.name}]: ${responseText}`;
    }

    // 3. Record reply WITH threadId & orchestration deliverable
    CommunicationBus.sendMessage({
      projectId: orchestrationResult?.project?.id || contextProjectId || "direct-inquiry",
      taskId: null,
      senderAgentId: agentId,
      receiverAgentId: "HUMAN_OWNER",
      messageType: "FINDING",
      content: agentReply,
      metadata: {
        channel: "DIRECT_EXECUTIVE_CHAT",
        threadId,
        hasOrchestration: !!orchestrationResult,
        orchestration: orchestrationResult,
      },
    });

    db.logActivity({
      projectId: orchestrationResult?.project?.id || contextProjectId || null,
      agentId: agentId,
      actorRole: targetAgent.role,
      action: orchestrationResult ? "CEO_AUTONOMOUS_ORCHESTRATION" : "DIRECT_CHAT_REPLY",
      details: `[Thread: ${threadId}] ${targetAgent.name} answered: "${message.slice(0, 50)}..."`,
      payload: { threadId, query: message, reply: agentReply },
    });

    return NextResponse.json({
      success: true,
      threadId,
      agent: {
        id: targetAgent.id,
        name: targetAgent.name,
        role: targetAgent.role,
      },
      reply: agentReply,
      orchestration: orchestrationResult,
      timestamp: now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Chat endpoint failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
