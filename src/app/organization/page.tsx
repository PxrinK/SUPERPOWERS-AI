"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { Building2, Plus, Shield, Users } from "lucide-react";

export default function OrganizationPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const json = await res.json();
        setDepartments(json.departments || []);
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

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">
              Organization & Department Topology
            </h2>
            <p className="text-xs text-neutral-600 mt-0.5">
              CEO dynamically spins up, restructures, and terminates specialized divisions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="border border-neutral-300 bg-white p-4 rounded text-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-[11px] font-bold text-neutral-800">
                  {dept.code}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    dept.isActive
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {dept.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-neutral-950 text-sm">{dept.name}</h3>
                <p className="text-neutral-600 mt-1">{dept.description}</p>
              </div>

              <div className="pt-2 border-t border-neutral-200 text-[11px] font-mono text-neutral-500 space-y-1">
                <div>Manager Agent: {dept.managerAgentId || "Unassigned"}</div>
                <div>Status: {dept.isTemporary ? "Temporary Project Taskforce" : "Permanent Division"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
