"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { BookOpen, AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

export default function KnowledgePage() {
  const [data, setData] = useState<any>({ knowledge: [], cases: [] });

  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Memory & Knowledge Repository
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            System rules, historical case memories, verified facts vs assumptions, and Owner approval status.
          </p>
        </div>

        {/* Section 1: System Knowledge */}
        <div className="border border-neutral-300 bg-white p-5 rounded space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-200">
            System Knowledge & Verified Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.knowledge.map((k: any) => (
              <div
                key={k.id}
                className="border border-neutral-200 bg-neutral-50 p-3 rounded text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] bg-neutral-200 px-1.5 py-0.5 rounded font-bold text-neutral-800">
                    {k.category}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      k.isVerifiedFact
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {k.isVerifiedFact ? "VERIFIED FACT" : "ASSUMPTION"}
                  </span>
                </div>

                <h4 className="font-bold text-neutral-900">{k.title}</h4>
                <p className="text-neutral-700">{k.content}</p>

                <div className="pt-2 border-t border-neutral-200 text-[10px] font-mono text-neutral-500 flex justify-between">
                  <span>Source: {k.source}</span>
                  <span>Owner Approved: {k.isApprovedByOwner ? "Yes" : "Pending"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Case Memory */}
        <div className="border border-neutral-300 bg-white p-5 rounded space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-200">
            Case Memory (Historical Errors & Root-Cause Solutions)
          </h3>

          <div className="space-y-3">
            {data.cases.map((c: any) => (
              <div
                key={c.id}
                className="border border-neutral-200 bg-neutral-50 p-4 rounded text-xs space-y-2 font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 uppercase">
                    Domain: {c.projectCategory}
                  </span>
                  <span className="bg-neutral-200 text-neutral-800 text-[10px] px-2 py-0.5 rounded">
                    Outcome: {c.outcomeRating}/5
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded border border-neutral-200">
                    <span className="text-[10px] text-red-700 font-bold uppercase block mb-1">
                      Obstacle / Error:
                    </span>
                    <span className="text-neutral-800">{c.errorOrObstacle}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-neutral-200">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block mb-1">
                      Root Cause Analysis:
                    </span>
                    <span className="text-neutral-800">{c.rootCauseAnalysis}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-neutral-200 md:col-span-2">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block mb-1">
                      Applied Solution & Verification:
                    </span>
                    <span className="text-neutral-800">{c.appliedSolution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
