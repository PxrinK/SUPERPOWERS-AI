import { z } from "zod";

// ==========================================
// 1. Roles, Hierarchy & State Enums
// ==========================================

export const AgentRoleEnum = z.enum([
  "OWNER",
  "CEO",
  "DIVISION_MANAGER",
  "TEAM_LEADER",
  "SPECIALIST",
  "REVIEWER",
  "QA_AUDITOR"
]);
export type AgentRole = z.infer<typeof AgentRoleEnum>;

export const WorkflowStateEnum = z.enum([
  "understanding",
  "analyzing",
  "planning",
  "delegating",
  "in_progress",
  "reviewing",
  "self_review",
  "awaiting_approval",
  "approved",
  "completed",
  "blocked",
  "revision_required",
  "rejected",
  "cancelled",
  "failed"
]);
export type WorkflowState = z.infer<typeof WorkflowStateEnum>;

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const MessageTypeEnum = z.enum([
  "ASSIGNMENT",
  "PROGRESS_UPDATE",
  "FINDING",
  "QUESTION",
  "BLOCKER",
  "REVIEW_FEEDBACK",
  "HANDOFF",
  "COMPLETION_REPORT"
]);
export type MessageType = z.infer<typeof MessageTypeEnum>;

export const ReviewVerdictEnum = z.enum([
  "APPROVED",
  "REVISION_REQUESTED",
  "REJECTED"
]);
export type ReviewVerdict = z.infer<typeof ReviewVerdictEnum>;

export const ApprovalStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED"
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

export const MemoryCategoryEnum = z.enum([
  "SYSTEM_KNOWLEDGE",
  "CASE_MEMORY",
  "USER_PREFERENCE"
]);
export type MemoryCategory = z.infer<typeof MemoryCategoryEnum>;

// ==========================================
// 2. Organization, Department & Agent Entities
// ==========================================

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  ownerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string(), // e.g. "ENG", "RES", "QA", "OPS"
  description: z.string(),
  managerAgentId: z.string().uuid().nullable(),
  isActive: z.boolean().default(true),
  isTemporary: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Department = z.infer<typeof DepartmentSchema>;

export const AgentModelConfigSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(), // e.g. "google", "openai", "anthropic", "local"
  modelName: z.string(), // e.g. "gemini-1.5-pro", "gpt-4o", "claude-3-5-sonnet"
  temperature: z.number().min(0).max(2).default(0.2),
  maxTokens: z.number().int().positive().default(4096),
  supportsStreaming: z.boolean().default(true),
  isAvailable: z.boolean().default(true)
});
export type AgentModelConfig = z.infer<typeof AgentModelConfigSchema>;

export const AgentSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  departmentId: z.string().uuid().nullable(),
  name: z.string().min(1),
  role: AgentRoleEnum,
  managerId: z.string().uuid().nullable(),
  teamId: z.string().uuid().nullable(),
  modelConfigId: z.string().uuid(),
  systemInstructions: z.string(),
  responsibilities: z.array(z.string()),
  permissions: z.array(z.string()),
  allowedContexts: z.array(z.string()),
  status: z.enum(["IDLE", "BUSY", "PAUSED", "OFFLINE"]).default("IDLE"),
  isTemporary: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Agent = z.infer<typeof AgentSchema>;

// ==========================================
// 3. Projects, Tasks, Dependencies & Workflow
// ==========================================

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  ownerGoal: z.string(),
  title: z.string(),
  description: z.string(),
  state: WorkflowStateEnum.default("understanding"),
  complexityScore: z.number().int().min(1).max(10).default(1),
  assignedDepartmentIds: z.array(z.string().uuid()).default([]),
  finalReport: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Project = z.infer<typeof ProjectSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().nullable().default(null),
  departmentId: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string(),
  priority: TaskPriorityEnum.default("MEDIUM"),
  state: WorkflowStateEnum.default("planning"),
  assignedAgentId: z.string().uuid().nullable().default(null),
  assignedByAgentId: z.string().uuid().nullable().default(null),
  deadline: z.string().nullable().default(null),
  retryCount: z.number().int().default(0),
  maxRetries: z.number().int().default(3),
  structuredOutput: z.record(z.string(), z.any()).nullable().default(null),
  evidenceLinks: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Task = z.infer<typeof TaskSchema>;

export const TaskDependencySchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  dependsOnTaskId: z.string().uuid()
});
export type TaskDependency = z.infer<typeof TaskDependencySchema>;

// ==========================================
// 4. Inter-Agent Communication & Handoffs
// ==========================================

export const AgentMessageSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  senderAgentId: z.string().uuid(),
  receiverAgentId: z.string().uuid(),
  messageType: MessageTypeEnum,
  content: z.string(),
  evidenceReferences: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
  timestamp: z.string()
});
export type AgentMessage = z.infer<typeof AgentMessageSchema>;

export const HandoffSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  fromAgentId: z.string().uuid(),
  toAgentId: z.string().uuid(),
  handoffSummary: z.string(),
  artifacts: z.record(z.string(), z.any()).default({}),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).default("PENDING"),
  timestamp: z.string()
});
export type Handoff = z.infer<typeof HandoffSchema>;

// ==========================================
// 5. Reviews, QA & Verification
// ==========================================

export const QualityMetricScoreSchema = z.object({
  accuracyAndCompleteness: z.number().min(0).max(10),
  logicalConsistency: z.number().min(0).max(10),
  evidenceVerification: z.number().min(0).max(10),
  missingRequirements: z.number().min(0).max(10),
  riskAndEdgeCases: z.number().min(0).max(10)
});
export type QualityMetricScore = z.infer<typeof QualityMetricScoreSchema>;

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid(),
  reviewerAgentId: z.string().uuid(),
  targetAgentId: z.string().uuid(),
  isIndependentQA: z.boolean().default(false),
  verdict: ReviewVerdictEnum,
  scores: QualityMetricScoreSchema,
  feedbackNotes: z.string(),
  assumptionsIdentified: z.array(z.string()).default([]),
  risksIdentified: z.array(z.string()).default([]),
  timestamp: z.string()
});
export type Review = z.infer<typeof ReviewSchema>;

// ==========================================
// 6. Memory, Knowledge & Case Memory
// ==========================================

export const KnowledgeItemSchema = z.object({
  id: z.string().uuid(),
  category: MemoryCategoryEnum,
  title: z.string(),
  content: z.string(),
  isVerifiedFact: z.boolean().default(false),
  source: z.string(),
  requiresOwnerApproval: z.boolean().default(false),
  isApprovedByOwner: z.boolean().default(false),
  version: z.number().int().default(1),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

export const CaseMemorySchema = z.object({
  id: z.string().uuid(),
  projectCategory: z.string(),
  errorOrObstacle: z.string(),
  rootCauseAnalysis: z.string(),
  appliedSolution: z.string(),
  verificationSteps: z.string(),
  outcomeRating: z.number().min(1).max(5).default(5),
  tags: z.array(z.string()).default([]),
  timestamp: z.string()
});
export type CaseMemory = z.infer<typeof CaseMemorySchema>;

// ==========================================
// 7. Owner Approval Gate & Security Controls
// ==========================================

export const ApprovalGateSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string(),
  projectId: z.string().uuid(),
  taskId: z.string().uuid().nullable().default(null),
  planVersion: z.number().int().default(1),
  executionScope: z.string(), // Exact boundaries of what is allowed
  allowedActions: z.array(z.string()),
  status: ApprovalStatusEnum.default("PENDING"),
  requestedByAgentId: z.string().uuid(),
  decisionNotes: z.string().nullable().default(null),
  expiresAt: z.string(),
  decidedAt: z.string().nullable().default(null),
  createdAt: z.string()
});
export type ApprovalGate = z.infer<typeof ApprovalGateSchema>;

// ==========================================
// 8. Audit & Activity Logs
// ==========================================

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid().nullable().default(null),
  agentId: z.string().uuid().nullable().default(null),
  actorRole: AgentRoleEnum.or(z.literal("SYSTEM")),
  action: z.string(),
  details: z.string(),
  payload: z.record(z.string(), z.any()).default({}),
  timestamp: z.string()
});
export type ActivityLog = z.infer<typeof ActivityLogSchema>;
