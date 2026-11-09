"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { FolderKanban, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  }, []);

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            Corporate Initiatives & Projects
          </h2>
          <p className="text-xs text-neutral-600 mt-0.5">
            Owner mandates converted into decomposed project structures by CEO Aether.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="border border-neutral-300 bg-white p-8 rounded text-center text-xs text-neutral-500">
            No active initiatives found. Submit a task from the Executive Dashboard.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="border border-neutral-300 bg-white p-5 rounded text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-neutral-600">
                      ID: {proj.id}
                    </span>
                    <span className="font-mono text-[10px] bg-neutral-900 text-white px-2 py-0.5 rounded font-bold uppercase">
                      Complexity: {proj.complexityScore}/10
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-neutral-100 text-neutral-900 border border-neutral-300 uppercase">
                    State: {proj.state}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-neutral-950">{proj.title}</h3>
                  <p className="text-neutral-700 mt-1 font-mono text-[11px] bg-neutral-50 p-2 rounded border border-neutral-200">
                    Owner Directive: &ldquo;{proj.ownerGoal}&rdquo;
                  </p>
                </div>

                {proj.finalReport && (
                  <div className="pt-2 border-t border-neutral-200">
                    <span className="text-[10px] font-mono uppercase font-bold text-neutral-500">
                      CEO Synthesis & QA Report:
                    </span>
                    <pre className="font-mono text-[11px] text-neutral-800 bg-neutral-50 p-3 rounded border border-neutral-200 mt-1 whitespace-pre-wrap">
                      {proj.finalReport}
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
