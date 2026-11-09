"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { MessageSquare, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function WorkspacePage() {
  const [data, setData] = useState<any>({ messages: [], reviews: [], handoffs: [] });

  useEffect(() => {
    fetch("/api/workspace")
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Agent Workspace & Communication Bus
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Structured inter-agent messages, findings, handoffs, and verification reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inter-Agent Messages */}
          <div className="border border-neutral-300 bg-white p-4 rounded flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-200">
              Message Bus Stream
            </h3>

            <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {data.messages.length === 0 ? (
                <div className="p-6 text-center text-neutral-400 text-xs">No inter-agent messages yet.</div>
              ) : (
                data.messages.map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3 border border-neutral-200 bg-neutral-50 rounded text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-neutral-900">{m.senderAgentId}</span>
                        <ArrowRight className="w-3 h-3 text-neutral-400" />
                        <span className="font-bold text-neutral-900">{m.receiverAgentId}</span>
                      </div>
                      <span className="bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                        {m.messageType}
                      </span>
                    </div>

                    <p className="text-neutral-800 whitespace-pre-wrap font-sans text-xs">
                      {m.content}
                    </p>

                    {m.evidenceReferences?.length > 0 && (
                      <div className="text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-200">
                        Evidence Ref: {m.evidenceReferences.join(", ")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quality Assurance & Self-Reviews */}
          <div className="border border-neutral-300 bg-white p-4 rounded flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-200">
              QA Audit & Self-Review Records
            </h3>

            <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {data.reviews.length === 0 ? (
                <div className="p-6 text-center text-neutral-400 text-xs">No reviews submitted yet.</div>
              ) : (
                data.reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="p-3 border border-neutral-200 bg-neutral-50 rounded text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neutral-500">
                        Auditor: {rev.reviewerAgentId} {rev.isIndependentQA ? "(Independent QA)" : "(Self-Review)"}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          rev.verdict === "APPROVED"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {rev.verdict}
                      </span>
                    </div>

                    <p className="text-neutral-800 font-sans text-xs">{rev.feedbackNotes}</p>

                    {/* Metric Scores */}
                    <div className="grid grid-cols-2 gap-1 bg-white p-2 rounded border border-neutral-200 text-[10px] font-mono">
                      <div>Accuracy: {rev.scores.accuracyAndCompleteness}/10</div>
                      <div>Logic: {rev.scores.logicalConsistency}/10</div>
                      <div>Evidence: {rev.scores.evidenceVerification}/10</div>
                      <div>Risk Mitigated: {rev.scores.riskAndEdgeCases}/10</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
