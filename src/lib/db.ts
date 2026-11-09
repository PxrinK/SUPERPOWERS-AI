/**
 * In-Memory & Database-Ready Unified Storage for Superpowers AI
 * Implements strict type safety and normalization matching the 18 PostgreSQL tables.
 */
import {
  Organization,
  Department,
  Agent,
  AgentModelConfig,
  Project,
  Task,
  TaskDependency,
  AgentMessage,
  Handoff,
  Review,
  KnowledgeItem,
  CaseMemory,
  ApprovalGate,
  ActivityLog,
} from "./types/organization";

export class DataStore {
  public static instance: DataStore = new DataStore();

  public organizations: Map<string, Organization> = new Map();
  public departments: Map<string, Department> = new Map();
  public agentModels: Map<string, AgentModelConfig> = new Map();
  public agents: Map<string, Agent> = new Map();
  public projects: Map<string, Project> = new Map();
  public tasks: Map<string, Task> = new Map();
  public taskDependencies: Map<string, TaskDependency> = new Map();
  public messages: Map<string, AgentMessage> = new Map();
  public handoffs: Map<string, Handoff> = new Map();
  public reviews: Map<string, Review> = new Map();
  public knowledgeItems: Map<string, KnowledgeItem> = new Map();
  public caseMemories: Map<string, CaseMemory> = new Map();
  public approvals: Map<string, ApprovalGate> = new Map();
  public activityLogs: ActivityLog[] = [];

  private constructor() {
    this.seedDefaultOrganization();
  }

  private seedDefaultOrganization() {
    const orgId = "00000000-0000-0000-0000-000000000001";
    const now = new Date().toISOString();

    // 1. Organization
    this.organizations.set(orgId, {
      id: orgId,
      name: "Superpowers AI Enterprise",
      ownerId: "owner_superpower_01",
      createdAt: now,
      updatedAt: now,
    });

    // 2. Model Registry
    const models: AgentModelConfig[] = [
      {
        id: "model-gemini-pro",
        provider: "google",
        modelName: "gemini-1.5-pro",
        temperature: 0.2,
        maxTokens: 8192,
        supportsStreaming: true,
        isAvailable: true,
      },
      {
        id: "model-claude-sonnet",
        provider: "anthropic",
        modelName: "claude-3-5-sonnet",
        temperature: 0.1,
        maxTokens: 4096,
        supportsStreaming: true,
        isAvailable: true,
      },
      {
        id: "model-gpt-4o",
        provider: "openai",
        modelName: "gpt-4o",
        temperature: 0.3,
        maxTokens: 4096,
        supportsStreaming: true,
        isAvailable: true,
      },
    ];
    models.forEach((m) => this.agentModels.set(m.id, m));

    // 3. Departments
    const executiveDeptId = "dept-executive-001";
    const engineeringDeptId = "dept-engineering-001";
    const researchDeptId = "dept-research-001";
    const qaDeptId = "dept-qa-001";

    this.departments.set(executiveDeptId, {
      id: executiveDeptId,
      orgId,
      name: "Executive & Strategy",
      code: "EXEC",
      description: "Organization leadership, mission planning, and high-level strategy.",
      managerAgentId: "agent-ceo-001",
      isActive: true,
      isTemporary: false,
      createdAt: now,
      updatedAt: now,
    });

    this.departments.set(engineeringDeptId, {
      id: engineeringDeptId,
      orgId,
      name: "Systems Engineering",
      code: "ENG",
      description: "Architectural design, implementation, and code generation.",
      managerAgentId: "agent-mgr-eng-001",
      isActive: true,
      isTemporary: false,
      createdAt: now,
      updatedAt: now,
    });

    this.departments.set(researchDeptId, {
      id: researchDeptId,
      orgId,
      name: "Research & Analysis",
      code: "RES",
      description: "Fact extraction, market/tech research, and problem domain mapping.",
      managerAgentId: "agent-mgr-res-001",
      isActive: true,
      isTemporary: false,
      createdAt: now,
      updatedAt: now,
    });

    this.departments.set(qaDeptId, {
      id: qaDeptId,
      orgId,
      name: "Quality Assurance & Compliance",
      code: "QA",
      description: "Independent audit, verification, logical integrity, and risk identification.",
      managerAgentId: "agent-qa-lead-001",
      isActive: true,
      isTemporary: false,
      createdAt: now,
      updatedAt: now,
    });

    // 4. Baseline Corporate Agents
    const seedAgents: Agent[] = [
      {
        id: "agent-ceo-001",
        orgId,
        departmentId: executiveDeptId,
        name: "Aether (CEO)",
        role: "CEO",
        managerId: null, // Reports to Owner
        teamId: null,
        modelConfigId: "model-gemini-pro",
        systemInstructions:
          "You are the CEO of Superpowers AI. You break owner goals into projects, spin up departments, recruit specialist agents, assign work hierarchically, and coordinate QA reviews. Never execute external side effects without Owner approval.",
        responsibilities: [
          "Strategic planning",
          "Dynamic organization management",
          "Project decomposition",
          "Approval preparation",
        ],
        permissions: ["ORG_MANAGE", "AGENT_RECRUIT", "PROJECT_CREATE", "APPROVAL_REQUEST"],
        allowedContexts: ["CORPORATE_GOALS", "PORTFOLIO", "SYSTEM_KNOWLEDGE"],
        status: "IDLE",
        isTemporary: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "agent-mgr-eng-001",
        orgId,
        departmentId: engineeringDeptId,
        name: "Marcus (Engineering VP)",
        role: "DIVISION_MANAGER",
        managerId: "agent-ceo-001",
        teamId: null,
        modelConfigId: "model-claude-sonnet",
        systemInstructions:
          "You are the Engineering Division Manager. You receive project mandates from the CEO, structure technical tasks, delegate to team leads and specialists, and inspect pull requests.",
        responsibilities: [
          "Technical architecture",
          "Engineering task delegation",
          "Technical reviews",
        ],
        permissions: ["TASK_CREATE", "TASK_ASSIGN", "CODE_REVIEW"],
        allowedContexts: ["CODEBASE", "SYSTEM_KNOWLEDGE", "TECH_SPECS"],
        status: "IDLE",
        isTemporary: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "agent-mgr-res-001",
        orgId,
        departmentId: researchDeptId,
        name: "Sophia (Research Lead)",
        role: "DIVISION_MANAGER",
        managerId: "agent-ceo-001",
        teamId: null,
        modelConfigId: "model-gpt-4o",
        systemInstructions:
          "You are the Head of Research. You analyze requirements, verify source data, gather domain knowledge, and ensure assumptions are explicitly labeled.",
        responsibilities: [
          "Domain investigation",
          "Evidence sourcing",
          "Fact vs assumption distinction",
        ],
        permissions: ["RESEARCH_QUERY", "KNOWLEDGE_SUBMIT"],
        allowedContexts: ["LITERATURE", "DOCS", "CASE_MEMORY"],
        status: "IDLE",
        isTemporary: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "agent-qa-lead-001",
        orgId,
        departmentId: qaDeptId,
        name: "Vera (Independent QA)",
        role: "QA_AUDITOR",
        managerId: "agent-ceo-001",
        teamId: null,
        modelConfigId: "model-claude-sonnet",
        systemInstructions:
          "You are an Independent Quality Assurance Auditor. You rigorously verify all deliverables for accuracy, completeness, logical consistency, and risk factors. You hold veto power on unverified work.",
        responsibilities: [
          "Independent quality audit",
          "Veto unverified deliverables",
          "Risk & edge case auditing",
        ],
        permissions: ["QA_AUDIT", "QA_VETO", "SCORE_COMPLIANCE"],
        allowedContexts: ["ALL_OUTPUTS", "QUALITY_STANDARDS"],
        status: "IDLE",
        isTemporary: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    seedAgents.forEach((a) => this.agents.set(a.id, a));

    // 5. Initial Knowledge & Case Memory
    this.knowledgeItems.set("k-rule-001", {
      id: "k-rule-001",
      category: "SYSTEM_KNOWLEDGE",
      title: "Zero Unauthorized Execution Rule",
      content:
        "No AI agent in Superpowers AI may trigger destructive or production mutations without an active, verified Owner Approval Token.",
      isVerifiedFact: true,
      source: "Superpowers AI Master Constitution §9",
      requiresOwnerApproval: true,
      isApprovedByOwner: true,
      version: 1,
      tags: ["security", "governance", "approval-gate"],
      createdAt: now,
      updatedAt: now,
    });

    this.caseMemories.set("case-mem-001", {
      id: "case-mem-001",
      projectCategory: "Architecture",
      errorOrObstacle: "Uncontrolled cascading agent recursion on broad prompts.",
      rootCauseAnalysis: "Specialist agents spawned recursive subagents without depth boundaries.",
      appliedSolution: "Enforced strict hierarchical delegation with max depth = 3 and CEO pre-flight decomposition.",
      verificationSteps: "Tested with 10 high-complexity ambiguous tasks; all bounded cleanly.",
      outcomeRating: 5,
      tags: ["recursion-prevention", "orchestration"],
      timestamp: now,
    });

    // 6. Log Genesis Action
    this.activityLogs.push({
      id: "log-genesis-001",
      projectId: null,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "ORGANIZATION_GENESIS",
      details: "Superpowers AI Enterprise Organization initialized with 4 departments and 4 core leadership agents.",
      payload: { orgId, defaultDepts: 4, defaultAgents: 4 },
      timestamp: now,
    });
  }

  public logActivity(log: Omit<ActivityLog, "id" | "timestamp">) {
    const entry: ActivityLog = {
      ...log,
      id: "log-" + Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toISOString(),
    };
    this.activityLogs.unshift(entry);
    return entry;
  }
}

export const db = DataStore.instance;
