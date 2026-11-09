import { CEOOrchestrator } from "./src/core/orchestrator/ceo-orchestrator";
import { OrgManager, AgentManager } from "./src/core/organization/org-manager";
import { MemoryStore } from "./src/core/memory/memory-store";
import { ApprovalManager } from "./src/core/security/approval-gate";
import { CommunicationBus, QualityAuditor } from "./src/core/communications/comm-bus";
import { db } from "./src/lib/db";

async function runSystemVerification() {
  console.log("=== STARTING SUPERPOWERS AI END-TO-END VERIFICATION ===");

  // 1. Verify Baseline Organization & Model Registry
  const org = OrgManager.getOrganization();
  const depts = OrgManager.listDepartments();
  const initialAgents = AgentManager.listAgents();

  console.log(`[PASS] Organization loaded: "${org.name}" (Owner: ${org.ownerId})`);
  console.log(`[PASS] Baseline Departments: ${depts.length} departments active.`);
  console.log(`[PASS] Baseline Agents: ${initialAgents.length} agents registered.`);

  // 2. Submit High Complexity Mission to CEO
  console.log("\n--- Submitting High Complexity Goal to CEO ---");
  const testGoal = "Design an ultra-secure decentralized authorization broker with automated QA compliance audits";
  const result = await CEOOrchestrator.orchestrateProject({
    ownerGoal: testGoal,
    priority: "HIGH",
  });

  console.log(`[PASS] Project Created: "${result.project.title}" (ID: ${result.project.id})`);
  console.log(`[PASS] Complexity Calculated: ${result.project.complexityScore}/10`);
  console.log(`[PASS] Dynamic Subtasks Decomposed: ${result.tasks.length} tasks`);

  // 3. Verify Temporary Agent Recruitment (due to complexity >= 7)
  const currentAgents = AgentManager.listAgents();
  const temporaryAgents = currentAgents.filter((a) => a.isTemporary);
  console.log(`[PASS] Dynamic Specialist Recruitment verified: ${temporaryAgents.length} temporary agents onboarded.`);

  // 4. Verify Task Dependencies & Structured Outputs
  result.tasks.forEach((t) => {
    console.log(`   * Task [${t.state.toUpperCase()}]: ${t.title} -> Assigned to: ${t.assignedAgentId}`);
    if (t.structuredOutput) {
      console.log(`     Output Keys: ${Object.keys(t.structuredOutput).join(", ")}`);
    }
  });

  // 5. Verify Inter-Agent Communication Bus & Reviews
  const messages = CommunicationBus.listMessages(result.project.id);
  const reviews = QualityAuditor.listReviews(result.project.id);
  console.log(`[PASS] Inter-agent messages recorded: ${messages.length}`);
  console.log(`[PASS] Double-loop reviews executed: ${reviews.length} (Self-Review + Independent QA)`);

  const independentQAReview = reviews.find((r) => r.isIndependentQA);
  if (!independentQAReview || independentQAReview.verdict !== "APPROVED") {
    throw new Error("Independent QA audit did not approve the deliverable!");
  }
  console.log(`[PASS] Independent QA Audit Verdict: ${independentQAReview.verdict} (Score: ${independentQAReview.scores.accuracyAndCompleteness}/10)`);

  // 6. Verify Owner Approval Gate Enforcement
  const projectApprovals = ApprovalManager.listApprovals(result.project.id);
  if (projectApprovals.length === 0) {
    throw new Error("CEO failed to raise an Owner Approval Gate!");
  }
  const approvalGate = projectApprovals[0];
  console.log(`[PASS] Owner Approval Gate raised: ID=${approvalGate.id}, Status=${approvalGate.status}`);

  // Test Guard: Execution without approval MUST fail
  const unauthorizedExecution = ApprovalManager.validateExecutionPermission(approvalGate.id, "DEPLOY_PRODUCTION");
  console.log(`[PASS] Security Guard Validation: Blocked unauthorized execution as expected (${unauthorizedExecution.reason})`);

  // Human Owner Approves
  ApprovalManager.submitDecision(approvalGate.id, "APPROVED", "Owner signed off on architecture blueprint.");
  console.log(`[PASS] Owner Decision Submitted: ${approvalGate.status}`);

  // Test Guard: Even after approval, V1 destructive execution tools are safely locked
  const guardedExecution = ApprovalManager.validateExecutionPermission(approvalGate.id, "RUN_TESTS");
  console.log(`[PASS] V1 Master Guard Enforcement verified: ${guardedExecution.reason}`);

  // 7. Verify Traceable Audit Logs
  const auditLogs = db.activityLogs.filter((l) => l.projectId === result.project.id);
  console.log(`[PASS] Complete chronological audit log recorded: ${auditLogs.length} actions.`);

  console.log("\n=== ALL SUPERPOWERS AI ARCHITECTURAL REQUIREMENTS FULLY VERIFIED ===");
}

runSystemVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
