"use client";

import React, { useState } from "react";
import { Play, Code, Eye, ExternalLink, RefreshCw, Copy, Check } from "lucide-react";

interface LiveCodePreviewProps {
  code: string;
  language?: string;
  title?: string;
}

export default function LiveCodePreview({ code, language = "html", title = "Preview" }: LiveCodePreviewProps) {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isHtml =
    language.toLowerCase().includes("html") ||
    code.includes("<!DOCTYPE") ||
    code.includes("<html") ||
    code.includes("<div") ||
    code.includes("<style>");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-neutral-300 rounded overflow-hidden bg-white my-3 shadow-sm font-sans">
      {/* Top Header Bar */}
      <div className="bg-neutral-900 text-white px-3 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{title}</span>
          {isHtml && (
            <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
              Live Runnable
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Tabs */}
          {isHtml && (
            <div className="flex bg-neutral-800 rounded p-0.5 border border-neutral-700">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === "preview" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Live Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  activeTab === "code" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-300 hover:text-white"
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Source Code</span>
              </button>
            </div>
          )}

          {isHtml && activeTab === "preview" && (
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Reload Preview"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {isHtml && activeTab === "preview" ? (
        <div className="relative bg-white border-t border-neutral-200">
          <iframe
            key={refreshKey}
            srcDoc={code}
            title={title}
            sandbox="allow-scripts allow-modals"
            className="w-full h-80 border-0"
          />
        </div>
      ) : (
        <pre className="p-3 bg-neutral-950 text-neutral-100 text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
