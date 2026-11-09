"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  FolderKanban,
  FileCheck,
  CheckSquare,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/approvals");
      if (res.ok) {
        const d = await res.json();
        setApprovals(d.approvals || []);
        // Auto-expand first item if available
        if (d.approvals?.length > 0 && !expandedId) {
          setExpandedId(d.approvals[0].id);
        }
      }
    } finally {
      setLoading(false);
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
            Owner Approval Center & Final Deliverables
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            ศูนย์ตรวจรับรองผลงาน (Deliverables) และคำตอบสมบูรณ์จาก AI Organization พร้อมปุ่มสั่งอนุมัติการ Execute
          </p>
        </div>

        {approvals.length === 0 ? (
          <div className="border border-neutral-300 bg-white p-8 rounded text-center text-xs text-neutral-500">
            ยังไม่มีรายการขออนุมัติในระบบ สามารถสั่งงาน CEO ได้ที่หน้า{" "}
            <Link href="/chat" className="text-neutral-900 underline font-semibold">
              Executive Chat
            </Link>{" "}
            หรือ Dashboard
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((appr) => {
              const isApproved = appr.status === "APPROVED";
              const isRejected = appr.status === "REJECTED";
              const isPending = appr.status === "PENDING";
              const isExpanded = expandedId === appr.id;

              return (
                <div
                  key={appr.id}
                  className="border border-neutral-300 bg-white rounded text-xs overflow-hidden shadow-sm"
                >
                  {/* Approval Card Header */}
                  <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-neutral-500">ID: {appr.id}</span>
                        <span className="font-mono text-[10px] bg-neutral-200 border border-neutral-300 px-1.5 py-0.2 rounded text-neutral-800">
                          Plan v{appr.planVersion}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : isRejected
                              ? "bg-red-100 text-red-900 border border-red-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {appr.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-neutral-950 text-sm">
                        {appr.project?.title || appr.executionScope}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleDecision(appr.id, "REJECTED")}
                            className="px-3 py-1.5 text-xs border border-neutral-300 bg-white hover:bg-neutral-100 rounded text-neutral-800 font-medium"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleDecision(appr.id, "APPROVED")}
                            className="px-3 py-1.5 text-xs bg-neutral-950 hover:bg-neutral-800 text-white rounded font-medium flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Authorize Execution</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <div className="flex items-center space-x-1 font-mono text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>อนุมัติการ Execute แล้ว</span>
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : appr.id)}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-600 border border-neutral-300"
                        title={isExpanded ? "Collapse" : "Expand Deliverables"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Body Content / Deliverables */}
                  <div className="p-5 space-y-4">
                    {/* Execution Scope & Allowed Actions */}
                    <div className="bg-neutral-50 p-3 rounded border border-neutral-200 space-y-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-neutral-500">
                          ขอบเขตคำสั่งที่ขออนุมัติ (Execution Scope):
                        </span>
                        <p className="text-neutral-800 font-mono text-[11px] mt-0.5">
                          {appr.executionScope}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1 border-t border-neutral-200">
                        <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold mr-1">
                          Allowed Actions:
                        </span>
                        {appr.allowedActions?.map((act: string, idx: number) => (
                          <span
                            key={idx}
                            className="bg-white text-neutral-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-200"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* SECTION: คำตอบและรายงานสรุป (Executive Report) */}
                    {appr.project?.finalReport && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5 font-bold text-neutral-900">
                          <FileCheck className="w-4 h-4 text-neutral-700" />
                          <span>รายงานสรุปผลงานระดับผู้บริหาร (CEO Final Report):</span>
                        </div>
                        <pre className="font-mono text-[11px] text-neutral-900 bg-neutral-100 p-3.5 rounded border border-neutral-300 whitespace-pre-wrap leading-relaxed">
                          {appr.project.finalReport}
                        </pre>
                      </div>
                    )}

                    {/* SECTION: รายละเอียดผลลัพธ์ของแต่ละงานย่อย (Task Deliverables) */}
                    {appr.tasks && appr.tasks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-neutral-200">
                        <div className="flex items-center justify-between font-bold text-neutral-900">
                          <span className="flex items-center space-x-1.5">
                            <CheckSquare className="w-4 h-4 text-neutral-700" />
                            <span>ผลลัพธ์คำตอบจากแต่ละฝ่าย (Structured Deliverables by Department):</span>
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {appr.tasks.length} รายการงานย่อย
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {appr.tasks.map((task: any, tIdx: number) => (
                            <div
                              key={task.id}
                              className="border border-neutral-200 bg-neutral-50 p-3 rounded space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="font-bold text-neutral-900">
                                  {tIdx + 1}. {task.title}
                                </span>
                                <span className="bg-neutral-200 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold text-neutral-800">
                                  {task.state}
                                </span>
                              </div>

                              <p className="text-neutral-600 text-[11px]">{task.description}</p>
                              <div className="text-[10px] font-mono text-neutral-500">
                                Assigned: {task.assignedAgentId} | Priority: {task.priority}
                              </div>

                              {task.structuredOutput && (
                                <div className="mt-2 pt-2 border-t border-neutral-200">
                                  <span className="text-[10px] font-mono uppercase font-bold text-neutral-500">
                                    Structured Output / Blueprint:
                                  </span>
                                  <pre className="mt-1 p-2.5 bg-white rounded border border-neutral-200 text-neutral-800 text-[10px] font-mono overflow-x-auto">
                                    {JSON.stringify(task.structuredOutput, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}
