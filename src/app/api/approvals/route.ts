import { NextResponse } from "next/server";
import { ApprovalManager } from "@/core/security/approval-gate";
import { db } from "@/lib/db";
import { z } from "zod";

const DecisionSchema = z.object({
  approvalId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function GET() {
  const approvals = ApprovalManager.listApprovals();
  // Join with project and tasks info so Owner sees exact deliverables
  const enriched = approvals.map((appr) => {
    const project = db.projects.get(appr.projectId);
    const tasks = Array.from(db.tasks.values()).filter((t) => t.projectId === appr.projectId);
    return {
      ...appr,
      project: project || null,
      tasks,
    };
  });
  return NextResponse.json({ approvals: enriched });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const updated = ApprovalManager.submitDecision(
      parsed.data.approvalId,
      parsed.data.decision,
      parsed.data.notes
    );

    if (!updated) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    const project = db.projects.get(updated.projectId);
    const tasks = Array.from(db.tasks.values()).filter((t) => t.projectId === updated.projectId);

    return NextResponse.json({
      success: true,
      approval: {
        ...updated,
        project: project || null,
        tasks,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to submit decision", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
