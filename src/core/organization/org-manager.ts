import { db } from "@/lib/db";
import { Department, Agent, AgentRole } from "@/lib/types/organization";

export class OrgManager {
  public static getOrganization() {
    return Array.from(db.organizations.values())[0];
  }

  public static listDepartments(): Department[] {
    return Array.from(db.departments.values());
  }

  public static createDepartment(params: {
    name: string;
    code: string;
    description: string;
    managerAgentId?: string | null;
    isTemporary?: boolean;
  }): Department {
    const org = this.getOrganization();
    const id = "dept-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const dept: Department = {
      id,
      orgId: org.id,
      name: params.name,
      code: params.code.toUpperCase(),
      description: params.description,
      managerAgentId: params.managerAgentId || null,
      isActive: true,
      isTemporary: params.isTemporary ?? false,
      createdAt: now,
      updatedAt: now,
    };

    db.departments.set(id, dept);
    db.logActivity({
      projectId: null,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "DEPARTMENT_CREATED",
      details: `CEO created department: ${dept.name} (${dept.code})`,
      payload: dept,
    });

    return dept;
  }

  public static deactivateDepartment(deptId: string): boolean {
    const dept = db.departments.get(deptId);
    if (!dept) return false;

    dept.isActive = false;
    dept.updatedAt = new Date().toISOString();
    db.departments.set(deptId, dept);

    db.logActivity({
      projectId: null,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "DEPARTMENT_DEACTIVATED",
      details: `Department ${dept.name} deactivated`,
      payload: { deptId },
    });

    return true;
  }
}

export class AgentManager {
  public static listAgents(): Agent[] {
    return Array.from(db.agents.values());
  }

  public static getAgent(id: string): Agent | undefined {
    return db.agents.get(id);
  }

  public static recruitAgent(params: {
    name: string;
    role: AgentRole;
    departmentId?: string | null;
    managerId?: string | null;
    modelConfigId?: string;
    systemInstructions: string;
    responsibilities: string[];
    permissions?: string[];
    allowedContexts?: string[];
    isTemporary?: boolean;
  }): Agent {
    const org = OrgManager.getOrganization();
    const id = "agent-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const agent: Agent = {
      id,
      orgId: org.id,
      departmentId: params.departmentId || null,
      name: params.name,
      role: params.role,
      managerId: params.managerId || null,
      teamId: null,
      modelConfigId: params.modelConfigId || "model-gemini-pro",
      systemInstructions: params.systemInstructions,
      responsibilities: params.responsibilities,
      permissions: params.permissions || ["EXECUTE_SUBTASK"],
      allowedContexts: params.allowedContexts || ["TASK_SCOPE"],
      status: "IDLE",
      isTemporary: params.isTemporary ?? false,
      createdAt: now,
      updatedAt: now,
    };

    db.agents.set(id, agent);
    db.logActivity({
      projectId: null,
      agentId: "agent-ceo-001",
      actorRole: "CEO",
      action: "AGENT_RECRUITED",
      details: `New agent onboarded: ${agent.name} (${agent.role})`,
      payload: agent,
    });

    return agent;
  }

  public static updateAgentStatus(agentId: string, status: Agent["status"]) {
    const agent = db.agents.get(agentId);
    if (!agent) return;
    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    db.agents.set(agentId, agent);
  }
}
