"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Bot,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  FileText,
  Settings,
  AlertTriangle,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
} from "lucide-react";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({
    departments: 0,
    agents: 0,
    projects: 0,
    activeTasks: 0,
    pendingApprovals: 0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts || {});
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Executive Chat", href: "/chat", icon: MessageSquare },
    { label: "Organization", href: "/organization", icon: Building2, badge: counts.departments },
    { label: "Agents Directory", href: "/agents", icon: Bot, badge: counts.agents },
    { label: "Projects", href: "/projects", icon: FolderKanban, badge: counts.projects },
    { label: "Tasks & Delegation", href: "/tasks", icon: CheckSquare, badge: counts.activeTasks },
    { label: "Workspace & Comms", href: "/workspace", icon: MessageSquare },
    { label: "Knowledge & Cases", href: "/knowledge", icon: BookOpen },
    {
      label: "Approval Center",
      href: "/approvals",
      icon: ShieldCheck,
      badge: counts.pendingApprovals,
      alert: counts.pendingApprovals > 0,
    },
    { label: "Activity Logs", href: "/logs", icon: FileText },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-neutral-100 text-neutral-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-neutral-300 bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Org Header */}
          <div className="p-4 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-bold text-xs tracking-wider rounded">
                SP
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-neutral-950">SUPERPOWERS AI</h1>
                <p className="text-[10px] uppercase font-mono text-neutral-500">Autonomous Enterprise</p>
              </div>
            </div>
          </div>

          {/* Org Status Badge */}
          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 font-medium">Hierarchy Tier</span>
              <span className="font-mono text-neutral-900 font-semibold">Owner & CEO</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-neutral-500 font-medium">AI Brain</span>
              <span className="font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                GEMINI 2.5 FLASH
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-2 space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                        item.alert
                          ? "bg-red-700 text-white"
                          : active
                          ? "bg-neutral-700 text-neutral-200"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Owner Session Footer */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-900">Human Owner</span>
              <span className="text-[10px] text-neutral-500 font-mono">Supreme Authority</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-600" title="Active Authority Session" />
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-neutral-100">
        <header className="h-12 border-b border-neutral-300 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold text-neutral-400">Section</span>
            <span className="text-xs text-neutral-300">/</span>
            <span className="text-xs font-medium text-neutral-800 capitalize">
              {pathname === "/" ? "Executive Dashboard" : pathname.replace("/", "")}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-neutral-600">
            <div className="flex items-center space-x-1.5 font-mono text-[11px] bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800 animate-pulse" />
              <span>CEO: AETHER (ACTIVE)</span>
            </div>
            <button
              onClick={fetchStats}
              title="Refresh Data"
              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 border border-neutral-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
