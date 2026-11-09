"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { FileText, Filter } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((d) => setLogs(d.recentLogs || []));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Corporate Audit & Activity Logs
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Cryptographically chronological records of all agent messages, reviews, actions, and Owner gates.
          </p>
        </div>

        <div className="border border-neutral-300 bg-white rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 font-mono text-[11px] text-neutral-600">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor / Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-50">
                  <td className="p-3 text-neutral-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-neutral-900 whitespace-nowrap">
                    [{log.actorRole}]
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-800 font-sans">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
