import { NextResponse } from "next/server";
import { ApprovalManager } from "@/core/security/approval-gate";
import { z } from "zod";

const DecisionSchema = z.object({
  approvalId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function GET() {
  const approvals = ApprovalManager.listApprovals();
  return NextResponse.json({ approvals });
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

    return NextResponse.json({
      success: true,
      approval: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to submit decision", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
