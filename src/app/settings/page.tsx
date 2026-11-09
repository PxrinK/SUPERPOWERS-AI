"use client";

import React from "react";
import Shell from "@/components/layout/shell";
import { Settings, Shield, Cpu, Key, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            System & Model Governance Settings
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Decoupled multi-provider model routing, pgvector database configs, and security bounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-neutral-300 bg-white p-5 rounded text-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-neutral-200 pb-2">
              <Cpu className="w-4 h-4 text-neutral-800" />
              <h3 className="font-bold text-neutral-900 uppercase tracking-wide">
                Configured AI Model Providers
              </h3>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold text-neutral-900">Google Gemini (Default Orchestrator)</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Models: gemini-1.5-pro, gemini-1.5-flash</div>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold text-neutral-900">Anthropic Claude (QA & Code Review)</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Models: claude-3-5-sonnet</div>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold text-neutral-900">OpenAI (Research & Analysis)</div>
                  <div className="text-[10px] text-neutral-500 font-mono">Models: gpt-4o, gpt-4o-mini</div>
                </div>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                  CONNECTED
                </span>
              </div>
            </div>
          </div>

          <div className="border border-neutral-300 bg-white p-5 rounded text-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-neutral-200 pb-2">
              <Shield className="w-4 h-4 text-neutral-800" />
              <h3 className="font-bold text-neutral-900 uppercase tracking-wide">
                Security & Guard Policies
              </h3>
            </div>

            <div className="space-y-2 font-mono text-[11px] text-neutral-700">
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                <span className="font-bold text-neutral-900 block mb-0.5">Execution Guard V1:</span>
                Production mutations locked. Plans & dry-runs generated strictly for Owner review.
              </div>
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                <span className="font-bold text-neutral-900 block mb-0.5">Secret Storage:</span>
                API keys kept strictly server-side. Zero browser leakage.
              </div>
              <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded">
                <span className="font-bold text-neutral-900 block mb-0.5">State Machine Enforcement:</span>
                Transitions validated server-side across all 15 discrete lifecycle states.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
