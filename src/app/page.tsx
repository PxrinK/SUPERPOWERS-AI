"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import {
  Send,
  Building2,
  Bot,
  FolderKanban,
  CheckSquare,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [goalInput, setGoalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;

    setSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch("/api/projects/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerGoal: goalInput, priority: "HIGH" }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setSubmissionFeedback(resJson);
        setGoalInput("");
        loadData();
      } else {
        alert("Failed to orchestrate goal: " + (resJson.error || "Unknown"));
      }
    } catch (err: any) {
      alert("Error submitting to CEO: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header / Context */}
        <div className="border border-neutral-300 bg-white p-5 rounded">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase tracking-wider font-mono bg-neutral-900 text-white px-2 py-0.5 rounded font-bold">
                  Owner Directive Hub
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  Target: Autonomous Hierarchy Decomposition
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-950 mt-1">
                Command Superpowers AI Organization
              </h2>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl">
                Submit raw high-level goals. The CEO (Aether) will analyze complexity, spin up departments, recruit specialist agents, delegate tasks, execute multi-agent QA, and request your approval prior to final execution.
              </p>
            </div>
            <div className="shrink-0 flex items-center space-x-3 text-xs border-l border-neutral-200 pl-4">
              <div>
                <p className="text-[11px] text-neutral-500 font-mono">ORGANIZATION</p>
                <p className="font-semibold text-neutral-900">{data?.organization?.name || "Loading..."}</p>
              </div>
            </div>
          </div>

          {/* Goal Submission Form */}
          <form onSubmit={handleOwnerSubmit} className="mt-4 pt-4 border-t border-neutral-200">
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              Submit Directive / Mission Statement:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="e.g. Architect a scalable microservice auth bridge with rate-limiting and audit trails..."
                className="flex-1 border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-neutral-50 font-sans"
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !goalInput.trim()}
                className="bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-medium flex items-center space-x-1.5 shrink-0"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>CEO Orchestrating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch to CEO</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback on newly created initiative */}
          {submissionFeedback && (
            <div className="mt-4 p-3 bg-neutral-50 border border-neutral-300 rounded text-xs">
              <div className="flex items-center space-x-2 text-neutral-900 font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Initiative Orchestrated & Delegated: {submissionFeedback.project.title}</span>
              </div>
              <p className="text-neutral-700 font-mono text-[11px] whitespace-pre-wrap mt-1">
                {submissionFeedback.finalReport}
              </p>
            </div>
          )}
        </div>

        {/* Corporate Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="border border-neutral-300 bg-white p-3.5 rounded">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium">Departments</span>
              <Building2 className="w-4 h-4 text-neutral-700" />
            </div>
            <p className="text-xl font-bold font-mono text-neutral-950 mt-1">
              {data?.counts?.departments ?? 0}
            </p>
            <span className="text-[10px] text-neutral-500">Active Divisions</span>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 rounded">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium">Active Agents</span>
              <Bot className="w-4 h-4 text-neutral-700" />
            </div>
            <p className="text-xl font-bold font-mono text-neutral-950 mt-1">
              {data?.counts?.agents ?? 0}
            </p>
            <span className="text-[10px] text-neutral-500">CEO & Specialists</span>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 rounded">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium">Initiatives</span>
              <FolderKanban className="w-4 h-4 text-neutral-700" />
            </div>
            <p className="text-xl font-bold font-mono text-neutral-950 mt-1">
              {data?.counts?.projects ?? 0}
            </p>
            <span className="text-[10px] text-neutral-500">Decomposed Projects</span>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 rounded">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium">Subtasks</span>
              <CheckSquare className="w-4 h-4 text-neutral-700" />
            </div>
            <p className="text-xl font-bold font-mono text-neutral-950 mt-1">
              {data?.tasks?.length ?? 0}
            </p>
            <span className="text-[10px] text-neutral-500">Across Hierarchy</span>
          </div>

          <div className="border border-neutral-300 bg-white p-3.5 rounded">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium">Approval Gates</span>
              <ShieldCheck className="w-4 h-4 text-neutral-700" />
            </div>
            <p className="text-xl font-bold font-mono text-neutral-950 mt-1">
              {data?.counts?.pendingApprovals ?? 0}
            </p>
            <span className="text-[10px] text-neutral-500">Awaiting Owner</span>
          </div>
        </div>

        {/* Two Column Layout: Pending Approvals & Live Activity Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Owner Approvals */}
          <div className="border border-neutral-300 bg-white p-4 rounded flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Owner Approval Gate Queue
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">
                {data?.pendingApprovals?.length || 0} Pending Sign-offs
              </span>
            </div>

            <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto max-h-[360px]">
              {data?.pendingApprovals?.length === 0 ? (
                <div className="p-6 text-center text-neutral-400 text-xs">
                  No pending approvals. Submit a goal to trigger CEO decomposition and QA review.
                </div>
              ) : (
                data?.pendingApprovals?.map((appr: any) => (
                  <div
                    key={appr.id}
                    className="p-3 border border-neutral-200 bg-neutral-50 rounded text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-neutral-500">ID: {appr.id}</span>
                      <span className="bg-amber-100 text-amber-900 font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold">
                        AWAITING OWNER
                      </span>
                    </div>
                    <p className="font-semibold text-neutral-900">{appr.executionScope}</p>
                    <div className="text-[11px] text-neutral-600 font-mono">
                      Allowed Actions: {appr.allowedActions.join(", ")}
                    </div>
                    <div className="pt-2 flex justify-end gap-2 border-t border-neutral-200">
                      <button
                        onClick={async () => {
                          await fetch("/api/approvals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ approvalId: appr.id, decision: "REJECTED" }),
                          });
                          loadData();
                        }}
                        className="px-2.5 py-1 text-[11px] border border-neutral-300 bg-white hover:bg-neutral-100 rounded text-neutral-800 font-medium"
                      >
                        Reject
                      </button>
                      <button
                        onClick={async () => {
                          await fetch("/api/approvals", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ approvalId: appr.id, decision: "APPROVED" }),
                          });
                          loadData();
                        }}
                        className="px-2.5 py-1 text-[11px] bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium"
                      >
                        Authorize Execution
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Logs Feed */}
          <div className="border border-neutral-300 bg-white p-4 rounded flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-neutral-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Traceable Corporate Audit Log
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">Real-time Stream</span>
            </div>

            <div className="mt-3 flex-1 space-y-2 overflow-y-auto max-h-[360px]">
              {data?.recentLogs?.map((log: any) => (
                <div
                  key={log.id}
                  className="p-2 border-b border-neutral-100 last:border-0 text-xs flex items-start space-x-2 font-mono"
                >
                  <span className="text-[10px] text-neutral-400 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-semibold text-neutral-800">[{log.actorRole}]</span>
                      <span className="text-[11px] text-neutral-500">{log.action}</span>
                    </div>
                    <p className="text-neutral-700 font-sans text-xs mt-0.5 truncate">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
