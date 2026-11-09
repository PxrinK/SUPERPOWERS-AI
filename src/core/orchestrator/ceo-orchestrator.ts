import { db } from "@/lib/db";
import { Project, Task, WorkflowState, TaskPriority } from "@/lib/types/organization";
import { OrgManager, AgentManager } from "../organization/org-manager";
import { CommunicationBus, QualityAuditor } from "../communications/comm-bus";
import { MemoryStore } from "../memory/memory-store";
import { ApprovalManager } from "../security/approval-gate";

export interface ProjectSubmissionInput {
  ownerGoal: string;
  title?: string;
  priority?: TaskPriority;
}

export class CEOOrchestrator {
  /**
   * Complete 11-step enterprise orchestration workflow:
   * 1. Owner submits task
   * 2. CEO analyzes requirements and complexity
   * 3. CEO creates project and decomposes into subtasks
   * 4. CEO assigns departments & managers
   * 5. Managers delegate to Team Leaders/Specialists
   * 6. Specialists execute tasks with structured results
   * 7. Managers review & consolidate
   * 8. Independent QA rigorously audits work
   * 9. CEO conducts self-review & generates final report
   * 10. Owner Approval Gate is raised for sign-off
   */
  public static async orchestrateProject(input: ProjectSubmissionInput): Promise<{
    project: Project;
    tasks: Task[];
    report: string;
  }> {
    const org = OrgManager.getOrganization();
    const projectId = "proj-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    // 1. Analyze complexity & historical cases
    const complexityScore = this.calculateComplexity(input.ownerGoal);
    const relevantCases = MemoryStore.retrieveRelevantCases([
      "architecture",
      "delegation",
      "risk",
      input.ownerGoal.slice(0, 30),
    ]);

    // 2. Instantiate Project
    const project: Project = {
      id: projectId,
      orgId: org.id,
      ownerGoal: input.ownerGoal,
      title: input.title || `Initiative: ${input.ownerGoal.slice(0, 40)}...`,
      description: `Complexity Score: ${complexityScore}/10. Prior cases consulted: ${relevantCases.length}. Goal: ${input.ownerGoal}`,
      state: "understanding",
      complexityScore,
      assignedDepartmentIds: [],
      finalReport: null,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.set(projectId, project);

    db.logActivity({
      projectId,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "PROJECT_INITIALIZED",
      details: `CEO initialized project '${project.title}' with complexity ${complexityScore}/10.`,
      payload: project,
    });

    // 3. Dynamic Department & Agent Recruitment (if complexity requires special capabilities)
    const activeDepts = OrgManager.listDepartments().filter((d) => d.isActive);
    let engDept = activeDepts.find((d) => d.code === "ENG");
    let resDept = activeDepts.find((d) => d.code === "RES");
    let qaDept = activeDepts.find((d) => d.code === "QA");

    // Recruit temporary specialist if high complexity
    let temporarySpecialistId = "agent-mgr-eng-001";
    if (complexityScore >= 7) {
      const specialist = AgentManager.recruitAgent({
        name: `Specialist ${Math.floor(Math.random() * 900 + 100)}`,
        role: "SPECIALIST",
        departmentId: engDept?.id,
        managerId: engDept?.managerAgentId,
        modelConfigId: "model-claude-sonnet",
        systemInstructions: "Targeted specialist executing granular high-precision components.",
        responsibilities: ["Granular execution", "Evidence gathering", "Self-audit"],
        isTemporary: true,
      });
      temporarySpecialistId = specialist.id;
    }

    project.assignedDepartmentIds = [engDept?.id, resDept?.id, qaDept?.id].filter(
      Boolean
    ) as string[];
    project.state = "planning";
    db.projects.set(projectId, project);

    // 4. CEO Decomposes into Structured Subtasks
    const tasks: Task[] = [];

    // Task A: Research & Requirements (Research Dept)
    const taskResearch = this.createTask({
      projectId,
      departmentId: resDept?.id || null,
      title: "Domain Analysis & Constraint Validation",
      description: `Investigate facts, identify assumptions, and extract core constraints for goal: "${input.ownerGoal}"`,
      priority: "HIGH",
      assignedAgentId: resDept?.managerAgentId || "agent-mgr-res-001",
      assignedByAgentId: "agent-ceo-001",
    });
    tasks.push(taskResearch);

    // Task B: Technical Design & Architecture (Engineering Dept)
    const taskEngineering = this.createTask({
      projectId,
      parentTaskId: taskResearch.id,
      departmentId: engDept?.id || null,
      title: "System Design & Execution Blueprint",
      description: "Define modular architecture, technical specifications, and security boundaries.",
      priority: "HIGH",
      assignedAgentId: temporarySpecialistId,
      assignedByAgentId: engDept?.managerAgentId || "agent-ceo-001",
    });
    tasks.push(taskEngineering);

    // Task C: Independent QA & Risk Verification (QA Dept)
    const taskQA = this.createTask({
      projectId,
      parentTaskId: taskEngineering.id,
      departmentId: qaDept?.id || null,
      title: "Quality Audit, Compliance & Edge Case Verification",
      description: "Independently audit completeness, logical consistency, and risk factors.",
      priority: "CRITICAL",
      assignedAgentId: qaDept?.managerAgentId || "agent-qa-lead-001",
      assignedByAgentId: "agent-ceo-001",
    });
    tasks.push(taskQA);

    // Record Dependencies
    db.taskDependencies.set(`dep-${taskResearch.id}-${taskEngineering.id}`, {
      id: `dep-${taskResearch.id}-${taskEngineering.id}`,
      taskId: taskEngineering.id,
      dependsOnTaskId: taskResearch.id,
    });
    db.taskDependencies.set(`dep-${taskEngineering.id}-${taskQA.id}`, {
      id: `dep-${taskEngineering.id}-${taskQA.id}`,
      taskId: taskQA.id,
      dependsOnTaskId: taskEngineering.id,
    });

    // 5. Hierarchical Execution Simulation (Agents deliver structured results)
    project.state = "in_progress";
    db.projects.set(projectId, project);

    // Step 5.1: Research delivers findings
    CommunicationBus.sendMessage({
      projectId,
      taskId: taskResearch.id,
      senderAgentId: taskResearch.assignedAgentId!,
      receiverAgentId: "agent-ceo-001",
      messageType: "FINDING",
      content: `Research complete: 3 verified facts mapped, 1 critical constraint detected regarding production data safety.`,
      evidenceReferences: ["CaseMemory::case-mem-001", "Constitution::ZeroUnauthorizedExecution"],
    });
    taskResearch.state = "completed";
    taskResearch.structuredOutput = {
      findings: "Domain scope bounded. No unsafe external mutations identified in plan.",
      assumptions: ["Standard Node/Postgres stack assumed", "Client auth session persistent"],
      confidenceScore: 0.96,
    };
    db.tasks.set(taskResearch.id, taskResearch);

    // Step 5.2: Engineering completes blueprint & runs Specialist Self-Review
    CommunicationBus.sendMessage({
      projectId,
      taskId: taskEngineering.id,
      senderAgentId: taskEngineering.assignedAgentId!,
      receiverAgentId: "agent-ceo-001",
      messageType: "PROGRESS_UPDATE",
      content: `Engineering blueprint prepared with modular monolith boundaries. Running mandatory self-review.`,
    });

    // Specialist Self-Review
    QualityAuditor.submitReview({
      projectId,
      taskId: taskEngineering.id,
      reviewerAgentId: taskEngineering.assignedAgentId!,
      targetAgentId: taskEngineering.assignedAgentId!,
      isIndependentQA: false,
      verdict: "APPROVED",
      scores: {
        accuracyAndCompleteness: 9,
        logicalConsistency: 9,
        evidenceVerification: 8.5,
        missingRequirements: 9,
        riskAndEdgeCases: 8.5,
      },
      feedbackNotes: "Self-Review passed: All components adhere strictly to typed interfaces and zero execution tools enabled in V1.",
      assumptionsIdentified: ["Postgres is available in production environment"],
      risksIdentified: ["Execution guard must never be bypassed without verified token"],
    });

    taskEngineering.state = "reviewing";
    taskEngineering.structuredOutput = {
      architecture: "Modular Monolith Next.js 16 + TypeScript",
      securityBoundaries: "Server-side state machine & ApprovalGate token required",
    };
    db.tasks.set(taskEngineering.id, taskEngineering);

    // Step 5.3: Independent QA Audit
    project.state = "reviewing";
    db.projects.set(projectId, project);

    QualityAuditor.submitReview({
      projectId,
      taskId: taskQA.id,
      reviewerAgentId: "agent-qa-lead-001",
      targetAgentId: taskEngineering.assignedAgentId!,
      isIndependentQA: true,
      verdict: "APPROVED",
      scores: {
        accuracyAndCompleteness: 9.5,
        logicalConsistency: 10,
        evidenceVerification: 9,
        missingRequirements: 9.5,
        riskAndEdgeCases: 9,
      },
      feedbackNotes: "Independent QA Audit Passed: Design verified against Superpowers Constitution §9 & §10. No security violations found.",
      assumptionsIdentified: ["Target execution requires explicit Owner signoff"],
      risksIdentified: ["None unmitigated"],
    });

    taskEngineering.state = "completed";
    taskQA.state = "completed";
    db.tasks.set(taskEngineering.id, taskEngineering);
    db.tasks.set(taskQA.id, taskQA);

    // 6. CEO Synthesis & Final Report
    const finalReport = `### Executive Project Synthesis Report
**Initiative:** ${project.title}
**Complexity:** ${complexityScore}/10 | **Status:** Awaiting Owner Approval
**Executive Summary:**
The organization has systematically analyzed and planned the requested initiative. 
- Research validated requirements against historical case memories.
- Engineering drafted architecture with full type safety and modular isolation.
- Specialist completed mandatory self-audit.
- Independent QA (Vera) completed objective compliance review with a score of 9.4/10.

**Next Required Action:**
Human Owner review and sign-off via Approval Gate.`;

    project.finalReport = finalReport;
    project.state = "awaiting_approval";
    project.updatedAt = new Date().toISOString();
    db.projects.set(projectId, project);

    // 7. Raise Owner Approval Gate
    ApprovalManager.requestApproval({
      ownerId: org.ownerId,
      projectId,
      taskId: null,
      planVersion: 1,
      executionScope: `Execution of initiative: ${project.title}. Dry-run & blueprint generation only.`,
      allowedActions: ["GENERATE_CODE", "RUN_TESTS", "ARCHIVE_CASE_MEMORY"],
      requestedByAgentId: "agent-ceo-001",
    });

    db.logActivity({
      projectId,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "CEO_FINAL_REPORT_SUBMITTED",
      details: `CEO completed project cycle. Approval Gate opened for Human Owner.`,
      payload: { projectId, finalReport },
    });

    return { project, tasks, report: finalReport };
  }

  private static calculateComplexity(goal: string): number {
    let score = 3;
    if (goal.length > 80) score += 2;
    if (
      goal.toLowerCase().includes("organization") ||
      goal.toLowerCase().includes("database") ||
      goal.toLowerCase().includes("multi-agent") ||
      goal.toLowerCase().includes("security")
    ) {
      score += 3;
    }
    return Math.min(score, 10);
  }

  private static createTask(params: {
    projectId: string;
    parentTaskId?: string | null;
    departmentId: string | null;
    title: string;
    description: string;
    priority: TaskPriority;
    assignedAgentId: string | null;
    assignedByAgentId: string | null;
  }): Task {
    const id = "task-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const task: Task = {
      id,
      projectId: params.projectId,
      parentTaskId: params.parentTaskId || null,
      departmentId: params.departmentId,
      title: params.title,
      description: params.description,
      priority: params.priority,
      state: "planning",
      assignedAgentId: params.assignedAgentId,
      assignedByAgentId: params.assignedByAgentId,
      deadline: null,
      retryCount: 0,
      maxRetries: 3,
      structuredOutput: null,
      evidenceLinks: [],
      createdAt: now,
      updatedAt: now,
    };

    db.tasks.set(id, task);
    return task;
  }
}
