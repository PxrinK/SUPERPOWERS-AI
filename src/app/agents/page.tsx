"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { Bot, Cpu, KeyRound, Shield } from "lucide-react";

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">
              Agent Registry & Intelligence Binding
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              Decoupled agent identities from underlying LLM configurations and permissions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border border-neutral-300 bg-white p-4 rounded text-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-neutral-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    {agent.role.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-950 text-sm">{agent.name}</h3>
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">
                      {agent.role}
                    </span>
                  </div>
                </div>

                <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded text-[10px] border border-neutral-200 font-semibold text-neutral-700">
                  {agent.status}
                </span>
              </div>

              <div className="bg-neutral-50 p-2.5 rounded border border-neutral-200 space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-semibold text-neutral-700">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Model Config Binding:</span>
                  <span className="font-mono text-neutral-900">{agent.modelConfigId}</span>
                </div>
                <p className="text-[11px] text-neutral-600 italic">
                  &ldquo;{agent.systemInstructions.slice(0, 110)}...&rdquo;
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">
                  Responsibilities:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.responsibilities.map((r: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-neutral-100 text-neutral-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-200"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
