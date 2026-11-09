import { db } from "@/lib/db";
import {
  AgentMessage,
  MessageType,
  Handoff,
  Review,
  ReviewVerdict,
  QualityMetricScore,
} from "@/lib/types/organization";
import { AgentManager } from "../organization/org-manager";

export class CommunicationBus {
  public static listMessages(projectId?: string): AgentMessage[] {
    const msgs = Array.from(db.messages.values());
    if (projectId) {
      return msgs.filter((m) => m.projectId === projectId);
    }
    return msgs;
  }

  public static sendMessage(params: {
    projectId: string;
    taskId?: string | null;
    senderAgentId: string;
    receiverAgentId: string;
    messageType: MessageType;
    content: string;
    evidenceReferences?: string[];
    metadata?: Record<string, any>;
  }): AgentMessage {
    const id = "msg-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const sender = AgentManager.getAgent(params.senderAgentId);
    const receiver = AgentManager.getAgent(params.receiverAgentId);

    const message: AgentMessage = {
      id,
      projectId: params.projectId,
      taskId: params.taskId || null,
      senderAgentId: params.senderAgentId,
      receiverAgentId: params.receiverAgentId,
      messageType: params.messageType,
      content: params.content,
      evidenceReferences: params.evidenceReferences || [],
      metadata: params.metadata || {},
      timestamp: now,
    };

    db.messages.set(id, message);
    db.logActivity({
      projectId: params.projectId,
      agentId: params.senderAgentId,
      actorRole: sender?.role || "SPECIALIST",
      action: `MESSAGE_${params.messageType}`,
      details: `${sender?.name || "Agent"} -> ${receiver?.name || "Agent"}: ${params.content.slice(0, 80)}...`,
      payload: message,
    });

    return message;
  }

  public static createHandoff(params: {
    projectId: string;
    taskId: string;
    fromAgentId: string;
    toAgentId: string;
    handoffSummary: string;
    artifacts?: Record<string, any>;
  }): Handoff {
    const id = "handoff-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const handoff: Handoff = {
      id,
      projectId: params.projectId,
      taskId: params.taskId,
      fromAgentId: params.fromAgentId,
      toAgentId: params.toAgentId,
      handoffSummary: params.handoffSummary,
      artifacts: params.artifacts || {},
      status: "PENDING",
      timestamp: now,
    };

    db.handoffs.set(id, handoff);

    this.sendMessage({
      projectId: params.projectId,
      taskId: params.taskId,
      senderAgentId: params.fromAgentId,
      receiverAgentId: params.toAgentId,
      messageType: "HANDOFF",
      content: `Handoff initiated: ${params.handoffSummary}`,
      metadata: { handoffId: id },
    });

    return handoff;
  }
}

export class QualityAuditor {
  public static listReviews(projectId?: string): Review[] {
    const reviews = Array.from(db.reviews.values());
    if (projectId) {
      return reviews.filter((r) => r.projectId === projectId);
    }
    return reviews;
  }

  /**
   * Conducts structured Self-Review or Independent QA Audit.
   */
  public static submitReview(params: {
    projectId: string;
    taskId: string;
    reviewerAgentId: string;
    targetAgentId: string;
    isIndependentQA: boolean;
    verdict: ReviewVerdict;
    scores: QualityMetricScore;
    feedbackNotes: string;
    assumptionsIdentified?: string[];
    risksIdentified?: string[];
  }): Review {
    const id = "rev-" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const review: Review = {
      id,
      projectId: params.projectId,
      taskId: params.taskId,
      reviewerAgentId: params.reviewerAgentId,
      targetAgentId: params.targetAgentId,
      isIndependentQA: params.isIndependentQA,
      verdict: params.verdict,
      scores: params.scores,
      feedbackNotes: params.feedbackNotes,
      assumptionsIdentified: params.assumptionsIdentified || [],
      risksIdentified: params.risksIdentified || [],
      timestamp: now,
    };

    db.reviews.set(id, review);

    const reviewer = AgentManager.getAgent(params.reviewerAgentId);

    db.logActivity({
      projectId: params.projectId,
      agentId: params.reviewerAgentId,
      actorRole: reviewer?.role || "QA_AUDITOR",
      action: params.isIndependentQA ? "INDEPENDENT_QA_REVIEW" : "AGENT_SELF_REVIEW",
      details: `Verdict: ${params.verdict} on Task ${params.taskId} by ${reviewer?.name}. Feedback: ${params.feedbackNotes}`,
      payload: review,
    });

    // Notify target agent
    CommunicationBus.sendMessage({
      projectId: params.projectId,
      taskId: params.taskId,
      senderAgentId: params.reviewerAgentId,
      receiverAgentId: params.targetAgentId,
      messageType: "REVIEW_FEEDBACK",
      content: `[Quality Review: ${params.verdict}]\n${params.feedbackNotes}`,
      metadata: { reviewId: id, scores: params.scores },
    });

    return review;
  }
}
