import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrgManager, AgentManager } from "@/core/organization/org-manager";
import { ApprovalManager } from "@/core/security/approval-gate";
import { QualityAuditor } from "@/core/communications/comm-bus";

export async function GET() {
  const org = OrgManager.getOrganization();
  const departments = OrgManager.listDepartments();
  const agents = AgentManager.listAgents();
  const projects = Array.from(db.projects.values());
  const tasks = Array.from(db.tasks.values());
  const approvals = ApprovalManager.listApprovals();
  const reviews = QualityAuditor.listReviews();
  const recentLogs = db.activityLogs.slice(0, 20);

  return NextResponse.json({
    organization: org,
    counts: {
      departments: departments.length,
      agents: agents.length,
      projects: projects.length,
      activeTasks: tasks.filter((t) => t.state !== "completed").length,
      pendingApprovals: approvals.filter((a) => a.status === "PENDING").length,
      reviews: reviews.length,
    },
    departments,
    agents,
    projects,
    tasks,
    pendingApprovals: approvals.filter((a) => a.status === "PENDING"),
    recentLogs,
  });
}
