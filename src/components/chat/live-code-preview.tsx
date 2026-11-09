"use client";

import React, { useState, useEffect } from "react";
import {
  Code,
  Eye,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";

interface LiveCodePreviewProps {
  code: string;
  language?: string;
  title?: string;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

export default function LiveCodePreview({
  code,
  language = "html",
  title = "Preview",
}: LiveCodePreviewProps) {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>("desktop");

  const isHtml =
    language.toLowerCase().includes("html") ||
    code.includes("<!DOCTYPE") ||
    code.includes("<html") ||
    code.includes("<div") ||
    code.includes("<style>");

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    try {
      const blob = new Blob([code], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(code);
        win.document.close();
      }
    }
  };

  const getViewportWidthClass = () => {
    if (viewportMode === "mobile") return "w-[375px] max-w-full";
    if (viewportMode === "tablet") return "w-[768px] max-w-full";
    return "w-full";
  };

  return (
    <>
      <div
        className={`border border-neutral-300 rounded overflow-hidden bg-white my-3 shadow-xs font-sans transition-all ${
          isFullscreen
            ? "fixed inset-0 z-[100] flex flex-col w-screen h-[100dvh] my-0 rounded-none border-0"
            : "w-full"
        }`}
      >
        {/* Top Header Controls Bar */}
        <div className="bg-neutral-900 text-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
          {/* Left Title & Status */}
          <div className="flex items-center space-x-2 min-w-0">
            <span className="font-semibold truncate max-w-[140px] sm:max-w-xs">{title}</span>
            {isHtml && (
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                Live Runnable
              </span>
            )}
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {/* Viewport Device Switcher (Desktop / Tablet / Mobile) */}
            {isHtml && activeTab === "preview" && (
              <div className="flex bg-neutral-800 rounded p-0.5 border border-neutral-700 items-center">
                <button
                  type="button"
                  onClick={() => setViewportMode("desktop")}
                  title="โหมด Desktop (100% เต็มความกว้าง)"
                  className={`p-1 rounded transition-colors ${
                    viewportMode === "desktop"
                      ? "bg-neutral-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode("tablet")}
                  title="โหมด Tablet (768px)"
                  className={`p-1 rounded transition-colors ${
                    viewportMode === "tablet"
                      ? "bg-neutral-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewportMode("mobile")}
                  title="โหมด Mobile (375px)"
                  className={`p-1 rounded transition-colors ${
                    viewportMode === "mobile"
                      ? "bg-neutral-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Tab Switcher: Preview vs Code */}
            {isHtml && (
              <div className="flex bg-neutral-800 rounded p-0.5 border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeTab === "preview"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("code")}
                  className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeTab === "code"
                      ? "bg-white text-neutral-900 shadow-xs"
                      : "text-neutral-300 hover:text-white"
                  }`}
                >
                  <Code className="w-3 h-3" />
                  <span className="hidden sm:inline">Code</span>
                </button>
              </div>
            )}

            {/* Reload Iframe */}
            {isHtml && activeTab === "preview" && (
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="รีเฟรชหน้าเว็บตัวอย่าง"
                className="p-1 hover:bg-neutral-700 rounded text-neutral-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Open in New Tab Button */}
            {isHtml && (
              <button
                type="button"
                onClick={handleOpenNewTab}
                title="เปิดในหน้าต่างบราวเซอร์ใหม่ (Full Tab)"
                className="flex items-center space-x-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden md:inline">เปิดแท็บใหม่</span>
              </button>
            )}

            {/* Fullscreen Expand / Minimize Button */}
            {isHtml && (
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? "ย่อหน้าต่างกลับ (Esc)" : "ขยายเต็มจอ (Fullscreen)"}
                className="flex items-center space-x-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-200 transition-colors"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline">ย่อ</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">เต็มจอ</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Code Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Preview Canvas */}
        {isHtml && activeTab === "preview" ? (
          <div
            className={`relative bg-neutral-200/80 border-t border-neutral-300 flex justify-center items-center overflow-auto ${
              isFullscreen
                ? "flex-1 w-full h-full p-2 sm:p-4 bg-neutral-950"
                : "w-full h-[520px] sm:h-[600px] md:h-[680px] p-2 bg-neutral-100"
            }`}
          >
            <div
              className={`h-full bg-white transition-all shadow-md rounded overflow-hidden flex flex-col ${getViewportWidthClass()}`}
            >
              <iframe
                key={refreshKey}
                srcDoc={code}
                title={title}
                sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
                className="w-full flex-1 border-0 bg-white"
              />
            </div>
          </div>
        ) : (
          <pre
            className={`p-3 bg-neutral-950 text-neutral-100 text-[11px] font-mono overflow-auto leading-relaxed ${
              isFullscreen ? "flex-1 w-full h-full" : "max-h-[500px]"
            }`}
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
    </>
  );
}
