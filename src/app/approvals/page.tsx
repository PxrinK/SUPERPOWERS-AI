"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { ShieldCheck, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);

  const loadData = async () => {
    const res = await fetch("/api/approvals");
    if (res.ok) {
      const d = await res.json();
      setApprovals(d.approvals || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId: id, decision }),
    });
    loadData();
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Owner Approval Center
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Strict human-in-the-loop gatekeeper. No AI execution occurs without explicit cryptographic approval.
          </p>
        </div>

        {approvals.length === 0 ? (
          <div className="border border-neutral-300 bg-white p-8 rounded text-center text-xs text-neutral-500">
            No pending or historical approvals found.
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="border border-neutral-300 bg-white p-5 rounded text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-neutral-500">ID: {appr.id}</span>
                    <span className="font-mono text-[10px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                      Version: {appr.planVersion}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      appr.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-900"
                        : appr.status === "REJECTED"
                        ? "bg-red-100 text-red-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {appr.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-neutral-900 text-sm">Execution Scope:</h4>
                  <p className="text-neutral-700 font-mono text-[11px] bg-neutral-50 p-2.5 rounded border border-neutral-200 mt-1">
                    {appr.executionScope}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold mr-1">
                    Allowed Actions:
                  </span>
                  {appr.allowedActions.map((action: string, i: number) => (
                    <span
                      key={i}
                      className="bg-neutral-100 text-neutral-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-200"
                    >
                      {action}
                    </span>
                  ))}
                </div>

                {appr.status === "PENDING" && (
                  <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                    <button
                      onClick={() => handleDecision(appr.id, "REJECTED")}
                      className="px-3 py-1.5 text-xs border border-neutral-300 bg-white hover:bg-neutral-100 rounded text-neutral-800 font-medium"
                    >
                      Reject Initiative
                    </button>
                    <button
                      onClick={() => handleDecision(appr.id, "APPROVED")}
                      className="px-3 py-1.5 text-xs bg-neutral-950 hover:bg-neutral-800 text-white rounded font-medium flex items-center space-x-1"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Authorize Execution</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
