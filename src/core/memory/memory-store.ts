import { db } from "@/lib/db";
import { KnowledgeItem, CaseMemory, MemoryCategory } from "@/lib/types/organization";

export class MemoryStore {
  // ----------------------------------------
  // 1. Knowledge Base (System, Case, User Prefs)
  // ----------------------------------------
  public static listKnowledge(category?: MemoryCategory): KnowledgeItem[] {
    const items = Array.from(db.knowledgeItems.values());
    if (category) {
      return items.filter((k) => k.category === category);
    }
    return items;
  }

  public static addKnowledge(params: {
    category: MemoryCategory;
    title: string;
    content: string;
    isVerifiedFact: boolean;
    source: string;
    requiresOwnerApproval?: boolean;
    tags?: string[];
  }): KnowledgeItem {
    const id = "k-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const item: KnowledgeItem = {
      id,
      category: params.category,
      title: params.title,
      content: params.content,
      isVerifiedFact: params.isVerifiedFact,
      source: params.source,
      requiresOwnerApproval: params.requiresOwnerApproval ?? false,
      isApprovedByOwner: !params.requiresOwnerApproval, // If approval required, default false
      version: 1,
      tags: params.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    db.knowledgeItems.set(id, item);
    db.logActivity({
      projectId: null,
      agentId: "agent-mgr-res-001",
      actorRole: "DIVISION_MANAGER",
      action: "KNOWLEDGE_RECORDED",
      details: `New knowledge added: "${item.title}" (${item.isVerifiedFact ? "Verified Fact" : "Assumption"})`,
      payload: item,
    });

    return item;
  }

  // ----------------------------------------
  // 2. Case Memory (Errors, Root Causes, Verified Solutions)
  // ----------------------------------------
  public static listCaseMemories(queryTag?: string): CaseMemory[] {
    const cases = Array.from(db.caseMemories.values());
    if (queryTag) {
      return cases.filter((c) =>
        c.tags.some((t) => t.toLowerCase().includes(queryTag.toLowerCase()))
      );
    }
    return cases;
  }

  public static recordCaseMemory(params: {
    projectCategory: string;
    errorOrObstacle: string;
    rootCauseAnalysis: string;
    appliedSolution: string;
    verificationSteps: string;
    outcomeRating?: number;
    tags?: string[];
  }): CaseMemory {
    const id = "case-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const caseItem: CaseMemory = {
      id,
      projectCategory: params.projectCategory,
      errorOrObstacle: params.errorOrObstacle,
      rootCauseAnalysis: params.rootCauseAnalysis,
      appliedSolution: params.appliedSolution,
      verificationSteps: params.verificationSteps,
      outcomeRating: params.outcomeRating ?? 5,
      tags: params.tags || [],
      timestamp: now,
    };

    db.caseMemories.set(id, caseItem);
    db.logActivity({
      projectId: null,
      agentId: "agent-qa-lead-001",
      actorRole: "QA_AUDITOR",
      action: "CASE_MEMORY_ARCHIVED",
      details: `Archived resolution for: "${params.errorOrObstacle}"`,
      payload: caseItem,
    });

    return caseItem;
  }

  /**
   * Pre-flight retrieval: agents check case memory prior to tackling tasks.
   */
  public static retrieveRelevantCases(contextKeywords: string[]): CaseMemory[] {
    const allCases = Array.from(db.caseMemories.values());
    return allCases.filter((c) => {
      const fullText = (
        c.projectCategory +
        " " +
        c.errorOrObstacle +
        " " +
        c.appliedSolution +
        " " +
        c.tags.join(" ")
      ).toLowerCase();
      return contextKeywords.some((kw) => fullText.includes(kw.toLowerCase()));
    });
  }
}
