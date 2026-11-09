import { db } from "@/lib/db";
import { ApprovalGate, ApprovalStatus } from "@/lib/types/organization";

export class ApprovalManager {
  public static listApprovals(projectId?: string): ApprovalGate[] {
    const apps = Array.from(db.approvals.values());
    if (projectId) {
      return apps.filter((a) => a.projectId === projectId);
    }
    return apps;
  }

  public static getApproval(id: string): ApprovalGate | undefined {
    return db.approvals.get(id);
  }

  /**
   * CEO or Agents request formal Owner Approval before any execution
   */
  public static requestApproval(params: {
    ownerId: string;
    projectId: string;
    taskId?: string | null;
    planVersion: number;
    executionScope: string;
    allowedActions: string[];
    requestedByAgentId: string;
    expiresInHours?: number;
  }): ApprovalGate {
    const id = "appr-" + Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const expires = new Date(now.getTime() + (params.expiresInHours || 24) * 3600 * 1000);

    const gate: ApprovalGate = {
      id,
      ownerId: params.ownerId,
      projectId: params.projectId,
      taskId: params.taskId || null,
      planVersion: params.planVersion,
      executionScope: params.executionScope,
      allowedActions: params.allowedActions,
      status: "PENDING",
      requestedByAgentId: params.requestedByAgentId,
      decisionNotes: null,
      expiresAt: expires.toISOString(),
      decidedAt: null,
      createdAt: now.toISOString(),
    };

    db.approvals.set(id, gate);

    db.logActivity({
      projectId: params.projectId,
      agentId: params.requestedByAgentId,
      actorRole: "CEO",
      action: "APPROVAL_REQUESTED",
      details: `Owner Approval requested: Scope="${params.executionScope}"`,
      payload: gate,
    });

    return gate;
  }

  /**
   * Human Owner executes approval or rejection.
   */
  public static submitDecision(
    approvalId: string,
    decision: "APPROVED" | "REJECTED",
    notes?: string
  ): ApprovalGate | null {
    const gate = db.approvals.get(approvalId);
    if (!gate) return null;

    gate.status = decision;
    gate.decisionNotes = notes || null;
    gate.decidedAt = new Date().toISOString();
    db.approvals.set(approvalId, gate);

    db.logActivity({
      projectId: gate.projectId,
      agentId: null,
      actorRole: "OWNER",
      action: `APPROVAL_${decision}`,
      details: `Owner ${decision} Approval Gate ${approvalId}. Notes: ${notes || "None"}`,
      payload: gate,
    });

    // Update project state if relevant
    const project = db.projects.get(gate.projectId);
    if (project) {
      if (decision === "APPROVED") {
        project.state = "approved";
      } else {
        project.state = "rejected";
      }
      project.updatedAt = new Date().toISOString();
      db.projects.set(project.id, project);
    }

    return gate;
  }

  /**
   * Re-evaluates whether execution is permitted server-side.
   * STRICT ENFORCEMENT: Never allows real execution without APPROVED status and valid timestamp.
   */
  public static validateExecutionPermission(
    approvalId: string,
    requestedAction: string
  ): { permitted: boolean; reason?: string } {
    const gate = db.approvals.get(approvalId);
    if (!gate) {
      return { permitted: false, reason: "Approval Gate not found." };
    }

    if (gate.status !== "APPROVED") {
      return {
        permitted: false,
        reason: `Action blocked: Gate status is currently '${gate.status}'. Explicit Owner Approval required.`,
      };
    }

    if (new Date(gate.expiresAt) < new Date()) {
      return { permitted: false, reason: "Action blocked: Owner Approval has expired." };
    }

    if (!gate.allowedActions.includes(requestedAction) && !gate.allowedActions.includes("*")) {
      return {
        permitted: false,
        reason: `Action '${requestedAction}' is outside the authorized Owner Execution Scope.`,
      };
    }

    // In V1, execution tools are locked:
    return {
      permitted: false,
      reason: "V1 Execution Guard: Real destructive side-effects are disabled by master policy. Dry-run only.",
    };
  }
}
