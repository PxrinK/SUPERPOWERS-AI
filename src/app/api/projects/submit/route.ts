import { NextResponse } from "next/server";
import { CEOOrchestrator } from "@/core/orchestrator/ceo-orchestrator";
import { z } from "zod";

const SubmitProjectSchema = z.object({
  ownerGoal: z.string().min(3, "Goal must be at least 3 characters"),
  title: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = SubmitProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const result = await CEOOrchestrator.orchestrateProject({
      ownerGoal: parsed.data.ownerGoal,
      title: parsed.data.title,
      priority: parsed.data.priority,
    });

    return NextResponse.json({
      success: true,
      message: "CEO successfully analyzed and orchestrated initiative.",
      project: result.project,
      tasks: result.tasks,
      finalReport: result.report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal orchestration failure", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
