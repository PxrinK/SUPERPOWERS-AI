"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { CheckSquare, ArrowDown, UserCheck, AlertTriangle } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Hierarchical Task Delegation Tree
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Strict task assignments, parent dependencies, specialist executions, and QA handoffs.
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="border border-neutral-300 bg-white p-8 rounded text-center text-xs text-neutral-500">
            No tasks queued. Trigger a project from the Dashboard to see real-time hierarchical delegation.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-neutral-300 bg-white p-4 rounded text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-neutral-500">{task.id}</span>
                    <span className="font-mono text-[10px] bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded font-semibold text-neutral-700">
                      Priority: {task.priority}
                    </span>
                    {task.parentTaskId && (
                      <span className="font-mono text-[10px] text-neutral-500">
                        (Depends on: {task.parentTaskId})
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-[10px] uppercase font-bold bg-neutral-900 text-white px-2 py-0.5 rounded">
                    {task.state}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-neutral-950">{task.title}</h4>
                  <p className="text-neutral-600 mt-0.5">{task.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-[11px] font-mono text-neutral-600">
                  <div>
                    Assigned Agent:{" "}
                    <span className="font-semibold text-neutral-900">
                      {task.assignedAgentId || "Unassigned"}
                    </span>
                  </div>
                  <div>Delegated By: {task.assignedByAgentId || "CEO"}</div>
                </div>

                {task.structuredOutput && (
                  <div className="bg-neutral-50 p-2.5 rounded border border-neutral-200 text-[11px] font-mono">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">
                      Delivered Structured Output:
                    </span>
                    <pre className="text-neutral-800 mt-1 whitespace-pre-wrap">
                      {JSON.stringify(task.structuredOutput, null, 2)}
                    </pre>
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
