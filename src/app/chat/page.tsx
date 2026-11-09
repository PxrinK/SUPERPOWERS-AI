"use client";

import React, { useState, useEffect, useRef } from "react";
import Shell from "@/components/layout/shell";
import Link from "next/link";
import LiveCodePreview from "@/components/chat/live-code-preview";
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Trash2,
  Plus,
  MessageSquare,
  Paperclip,
  FileText,
  X,
  Sparkles,
} from "lucide-react";

interface ChatMessage {
  sender: "user" | "agent";
  text: string;
  time: string;
  agentName?: string;
  orchestration?: any;
  attachedFile?: {
    name: string;
    size: number;
    savedPath: string;
  };
}

interface ChatThread {
  id: string;
  title: string;
  agentId: string;
  updatedAt: string;
}

export default function ChatPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("agent-ceo-001");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-default");
  const [mobileChatSidebarOpen, setMobileChatSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedTaskIdx, setCopiedTaskIdx] = useState<number | null>(null);

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getWelcomeMessage = (agentName = "Aether (CEO)"): ChatMessage => ({
    sender: "agent",
    agentName,
    text: `สวัสดีครับท่าน Human Owner ผมคือ ${agentName}\n\nระบบรองรับการพิมพ์ตอบแบบ Streaming Real-time, กล่อง Live Code Preview รันหน้าเว็บได้ทันที และปุ่มอัปโหลดไฟล์ (📎) เพื่อให้วิเคราะห์เอกสาร/โค้ด/PDF ได้ครบครันครับ!`,
    time: "Welcome",
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([getWelcomeMessage()]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load Agents & Saved Threads
  useEffect(() => {
    fetch("/api/organization")
      .then((r) => r.json())
      .then((d) => setAgents(d.agents || []));

    const savedThreadsRaw = localStorage.getItem("sp_chat_threads_v2");
    if (savedThreadsRaw) {
      try {
        const parsed = JSON.parse(savedThreadsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
          setActiveThreadId(parsed[0].id);
          return;
        }
      } catch {}
    }

    const initialThread: ChatThread = {
      id: "thread-default",
      title: "หัวข้อสนทนาหลัก #1",
      agentId: "agent-ceo-001",
      updatedAt: new Date().toLocaleTimeString(),
    };
    setThreads([initialThread]);
    localStorage.setItem("sp_chat_threads_v2", JSON.stringify([initialThread]));
  }, []);

  // 2. Load Messages for Active Thread
  const loadThreadHistory = async (agentId: string, threadId: string) => {
    const selectedAgentObj = agents.find((a) => a.id === agentId);
    const welcome = getWelcomeMessage(selectedAgentObj?.name || "Aether (CEO)");

    try {
      const localKey = `sp_chat_msg_${agentId}_${threadId}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChatHistory(parsed);
          } else {
            setChatHistory([welcome]);
          }
        } catch {
          setChatHistory([welcome]);
        }
      } else {
        setChatHistory([welcome]);
      }

      const res = await fetch(`/api/chat?agentId=${agentId}&threadId=${threadId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && data.history.length > 0) {
          setChatHistory(data.history);
          localStorage.setItem(localKey, JSON.stringify(data.history));
        }
      }
    } catch (e) {
      console.warn("Failed to sync chat history:", e);
    }
  };

  useEffect(() => {
    if (activeThreadId) {
      loadThreadHistory(selectedAgentId, activeThreadId);
    }
  }, [selectedAgentId, activeThreadId, agents.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingText]);

  // 3. Thread Management
  const handleCreateNewThread = () => {
    const newId = "thread-" + Math.random().toString(36).substring(2, 9);
    const agentThreadsCount = threads.filter((t) => t.agentId === selectedAgentId).length;
    const newThread: ChatThread = {
      id: newId,
      title: `เรื่องใหม่ #${agentThreadsCount + 1}`,
      agentId: selectedAgentId,
      updatedAt: new Date().toLocaleTimeString(),
    };

    const updated = [newThread, ...threads];
    setThreads(updated);
    localStorage.setItem("sp_chat_threads_v2", JSON.stringify(updated));
    setActiveThreadId(newId);

    const selectedAgentObj = agents.find((a) => a.id === selectedAgentId);
    setChatHistory([getWelcomeMessage(selectedAgentObj?.name || "Aether (CEO)")]);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const localKey = `sp_chat_msg_${selectedAgentId}_${threadId}`;
    localStorage.removeItem(localKey);

    const remaining = threads.filter((t) => t.id !== threadId);
    if (remaining.length === 0) {
      const fallback: ChatThread = {
        id: "thread-" + Math.random().toString(36).substring(2, 9),
        title: "หัวข้อสนทนาใหม่ #1",
        agentId: selectedAgentId,
        updatedAt: new Date().toLocaleTimeString(),
      };
      setThreads([fallback]);
      localStorage.setItem("sp_chat_threads_v2", JSON.stringify([fallback]));
      setActiveThreadId(fallback.id);
    } else {
      setThreads(remaining);
      localStorage.setItem("sp_chat_threads_v2", JSON.stringify(remaining));
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0].id);
      }
    }
  };

  // 4. File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadedFileMeta(data.file);
      } else {
        alert("Upload error: " + data.error);
        setSelectedFile(null);
      }
    } catch (err: any) {
      alert("Upload failed: " + err.message);
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedTaskIdx(idx);
    setTimeout(() => setCopiedTaskIdx(null), 2000);
  };

  // 5. Send Message (with Live Streaming Text or Autonomous Orchestration)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !uploadedFileMeta) || loading || isStreaming) return;

    let userText = inputMessage.trim();
    if (uploadedFileMeta) {
      userText = userText
        ? `[ไฟล์แนบ: ${uploadedFileMeta.name}]\n${userText}\n\nเนื้อหาเอกสาร:\n${uploadedFileMeta.contentSample}`
        : `[ไฟล์แนบ: ${uploadedFileMeta.name}]\nช่วยวิเคราะห์และสรุปสาระสำคัญของเอกสาร/โค้ดนี้:\n\n${uploadedFileMeta.contentSample}`;
    }

    const currentFileAttachment = uploadedFileMeta;
    setInputMessage("");
    setSelectedFile(null);
    setUploadedFileMeta(null);
    setLoading(true);

    const now = new Date().toLocaleTimeString();
    const newUserMsg: ChatMessage = {
      sender: "user",
      text: userText,
      time: now,
      attachedFile: currentFileAttachment,
    };

    const localKey = `sp_chat_msg_${selectedAgentId}_${activeThreadId}`;
    const updatedHistory = [...chatHistory, newUserMsg];
    setChatHistory(updatedHistory);
    localStorage.setItem(localKey, JSON.stringify(updatedHistory));

    // Update Thread title if first message
    const updatedThreads = threads.map((t) => {
      if (t.id === activeThreadId && (t.title.startsWith("เรื่องใหม่") || t.title.startsWith("หัวข้อสนทนา"))) {
        return {
          ...t,
          title: userText.length > 28 ? userText.slice(0, 28) + "..." : userText,
          updatedAt: now,
        };
      }
      return t;
    });
    setThreads(updatedThreads);
    localStorage.setItem("sp_chat_threads_v2", JSON.stringify(updatedThreads));

    // Check if directive requires autonomous project decomposition
    const isDirective =
      userText.includes("สร้างระบบ") ||
      userText.includes("ออกแบบ") ||
      userText.includes("ขอ sql") ||
      userText.includes("สร้างไฟล์");

    if (isDirective) {
      // Full Autonomous Orchestration
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: selectedAgentId,
            threadId: activeThreadId,
            message: userText,
            autoOrchestrate: true,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          const newAgentMsg: ChatMessage = {
            sender: "agent",
            agentName: data.agent.name,
            text: data.reply,
            time: new Date().toLocaleTimeString(),
            orchestration: data.orchestration,
          };
          const finalHistory = [...updatedHistory, newAgentMsg];
          setChatHistory(finalHistory);
          localStorage.setItem(localKey, JSON.stringify(finalHistory));
        }
      } catch (err: any) {
        alert("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Real-time Streaming Text Response (Gemini SSE)
      setLoading(false);
      setIsStreaming(true);
      setStreamingText("");

      try {
        const pastTurns = chatHistory
          .slice(-6)
          .map((m) => ({ role: m.sender === "user" ? ("user" as const) : ("model" as const), text: m.text }));

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: selectedAgentId,
            message: userText,
            conversationHistory: pastTurns,
          }),
        });

        if (!response.body) throw new Error("No readable stream received");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamAccumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          streamAccumulated += chunk;
          setStreamingText(streamAccumulated);
        }

        const agentObj = agents.find((a) => a.id === selectedAgentId);
        const finalAgentMsg: ChatMessage = {
          sender: "agent",
          agentName: agentObj?.name || "Aether (CEO)",
          text: streamAccumulated,
          time: new Date().toLocaleTimeString(),
        };

        const finalHistory = [...updatedHistory, finalAgentMsg];
        setChatHistory(finalHistory);
        localStorage.setItem(localKey, JSON.stringify(finalHistory));
      } catch (err: any) {
        console.error("Streaming error:", err);
      } finally {
        setIsStreaming(false);
        setStreamingText("");
      }
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const currentAgentThreads = threads.filter((t) => t.agentId === selectedAgentId);
  const activeThreadObj = threads.find((t) => t.id === activeThreadId);

  // Helper function to extract HTML code blocks for live preview
  const extractHtmlBlocks = (content: string) => {
    const htmlRegex = /```html([\s\S]*?)```/gi;
    const matches: string[] = [];
    let match;
    while ((match = htmlRegex.exec(content)) !== null) {
      if (match[1].trim()) matches.push(match[1].trim());
    }
    return matches;
  };

  return (
    <Shell>
      <div className="h-[calc(100dvh-4.5rem)] sm:h-[calc(100dvh-5.5rem)] w-full max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-3 lg:gap-4 relative">
        {/* Left Sidebar: Topic Threads & Agent Directory */}
        <div className="hidden lg:flex w-80 border border-neutral-300 bg-white rounded flex-col shrink-0 overflow-hidden shadow-xs">
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 space-y-2">
            <button
              onClick={handleCreateNewThread}
              className="w-full bg-neutral-950 hover:bg-neutral-800 text-white py-2 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เริ่มแชตเรื่องใหม่ (New Chat)</span>
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 flex flex-col min-h-0 border-b border-neutral-200">
            <div className="px-3 py-2 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-600">
                รายการหัวข้อสนทนา ({currentAgentThreads.length})
              </span>
              <span className="text-[10px] text-neutral-500">แยกทีละเรื่อง</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {currentAgentThreads.map((thread) => {
                const isActive = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group flex items-center justify-between p-2 rounded text-xs cursor-pointer border transition-colors ${
                      isActive
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-75" />
                      <div className="truncate flex-1">
                        <div className="font-medium truncate">{thread.title}</div>
                        <div className={`text-[9px] font-mono ${isActive ? "text-neutral-400" : "text-neutral-400"}`}>
                          {thread.updatedAt}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      title="ลบแชตนี้"
                      className={`p-1 rounded opacity-60 hover:opacity-100 ${
                        isActive ? "hover:bg-neutral-700 text-neutral-300" : "hover:bg-red-50 hover:text-red-600 text-neutral-400"
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agent Switcher */}
          <div className="h-48 flex flex-col shrink-0">
            <div className="px-3 py-1.5 bg-neutral-100 border-b border-neutral-200">
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-600">เลือก Agent สนทนา</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {agents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                const isCEO = agent.role === "CEO";
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgentId(agent.id);
                      const agentThreads = threads.filter((t) => t.agentId === agent.id);
                      if (agentThreads.length > 0) setActiveThreadId(agentThreads[0].id);
                    }}
                    className={`w-full text-left p-2 rounded text-xs transition-colors border ${
                      isSelected
                        ? "bg-neutral-800 text-white border-neutral-800"
                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center space-x-1">
                        <span>{agent.name}</span>
                        {isCEO && (
                          <span className="text-[9px] bg-amber-500 text-black px-1 rounded font-extrabold">LEAD</span>
                        )}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1 rounded ${
                          isSelected ? "bg-neutral-700 text-neutral-200" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {agent.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        
        {/* Mobile Chat Drawer Overlay */}
        {mobileChatSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs"
              onClick={() => setMobileChatSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col">
              <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">หัวข้อแชต & Agent</span>
                <button
                  type="button"
                  onClick={() => setMobileChatSidebarOpen(false)}
                  className="p-1 text-neutral-500 hover:text-neutral-900 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 border-b border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    handleCreateNewThread();
                    setMobileChatSidebarOpen(false);
                  }}
                  className="w-full bg-neutral-950 hover:bg-neutral-800 text-white py-2 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>เริ่มแชตเรื่องใหม่</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 border-b border-neutral-200">
                <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-500 font-bold">
                  หัวข้อสนทนา ({currentAgentThreads.length})
                </div>
                {currentAgentThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      setMobileChatSidebarOpen(false);
                    }}
                    className={`p-2 rounded text-xs cursor-pointer border ${
                      thread.id === activeThreadId
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200"
                    }`}
                  >
                    <div className="font-medium truncate">{thread.title}</div>
                    <div className="text-[9px] font-mono opacity-70">{thread.updatedAt}</div>
                  </div>
                ))}
              </div>
              <div className="h-44 flex flex-col shrink-0 bg-neutral-50">
                <div className="px-3 py-1.5 border-b border-neutral-200 text-[10px] font-mono uppercase font-bold text-neutral-600">
                  เลือก Agent
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => {
                        setSelectedAgentId(agent.id);
                        const agentThreads = threads.filter((t) => t.agentId === agent.id);
                        if (agentThreads.length > 0) setActiveThreadId(agentThreads[0].id);
                        setMobileChatSidebarOpen(false);
                      }}
                      className={`w-full text-left p-1.5 rounded text-xs border ${
                        agent.id === selectedAgentId
                          ? "bg-neutral-800 text-white border-neutral-800"
                          : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{agent.name}</span>
                        <span className="text-[9px] font-mono">{agent.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Interactive Chat Panel */}
        <div className="flex-1 border border-neutral-300 bg-white rounded flex flex-col overflow-hidden shadow-xs">
          {/* Header */}
          <div className="p-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              
            {/* Mobile Toggle Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileChatSidebarOpen(true)}
              className="lg:hidden p-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded text-neutral-800 text-[11px] font-medium flex items-center space-x-1 shrink-0"
              title="หัวข้อและ Agent"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">หัวข้อ/Agent</span>
            </button>
            <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                {selectedAgent?.role.slice(0, 2) || "AI"}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-neutral-950">{activeThreadObj?.title || "ห้องสนทนา"}</h3>
                  <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded font-mono">
                    {selectedAgent?.name || "CEO"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  Real-time Streaming • Live Code Preview • Document Analysis Enabled
                </span>
              </div>
            </div>

            <button
              onClick={handleCreateNewThread}
              className="text-[11px] bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 px-2.5 py-1 rounded font-medium flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มแชตใหม่</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
            {chatHistory.map((item, index) => {
              const isUser = item.sender === "user";
              const htmlSnippets = extractHtmlBlocks(item.text);

              return (
                <div key={index} className={`flex flex-col ${isUser ? "items-end" : "items-start"} ${htmlSnippets.length > 0 || item.orchestration ? "w-full" : ""}`}>

                  <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-500 mb-1 px-1">
                    <span>{isUser ? "Human Owner (You)" : item.agentName}</span>
                    <span>•</span>
                    <span suppressHydrationWarning>{item.time}</span>
                  </div>

                  <div
                    className={`${htmlSnippets.length > 0 || item.orchestration ? "w-full max-w-full" : isUser ? "max-w-[85%]" : "max-w-[92%]"} rounded p-3 text-xs leading-relaxed space-y-3 ${
                      isUser ? "bg-neutral-950 text-white" : "bg-white text-neutral-900 border border-neutral-300 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.text}</p>

                    {/* LIVE CODE PREVIEW FOR HTML/UI (รันดูหน้าเว็บได้ในตัว) */}
                    {htmlSnippets.length > 0 && !isUser && (
                      <div className="mt-2 space-y-2">
                        {htmlSnippets.map((htmlCode, hIdx) => (
                          <LiveCodePreview
                            key={hIdx}
                            code={htmlCode}
                            language="html"
                            title={`Live Web Preview #${hIdx + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Deliverables / Autonomous Execution Output */}
                    {item.orchestration && (
                      <div className="mt-3 pt-3 border-t border-neutral-200 space-y-3 font-mono text-[11px] bg-neutral-50 p-3 rounded text-neutral-800">
                        <div className="flex items-center justify-between font-bold text-neutral-900">
                          <span className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>ผลงานและชิ้นงานที่ส่งมอบ (Approved Deliverables):</span>
                          </span>
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                            CEO Auto-Approved
                          </span>
                        </div>

                        <div className="space-y-3">
                          {item.orchestration.tasks.map((t: any, i: number) => {
                            const output = t.structuredOutput;
                            const isCode = output?.sourceCode || output?.sqlScript;
                            const codeSnippet = output?.sourceCode || output?.sqlScript;
                            const isHtmlCode = codeSnippet && (codeSnippet.includes("<!DOCTYPE") || codeSnippet.includes("<html"));

                            return (
                              <div
                                key={i}
                                className="p-3 bg-white rounded border border-neutral-300 text-[10px] space-y-2 shadow-xs"
                              >
                                <div className="font-semibold text-neutral-900 flex justify-between items-center border-b border-neutral-200 pb-1.5">
                                  <span className="text-xs">
                                    {i + 1}. {t.title}
                                  </span>
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
                                    {t.state}
                                  </span>
                                </div>

                                <div className="text-neutral-500 text-[9px]">
                                  ฝ่ายปฏิบัติงาน: <span className="font-semibold text-neutral-800">{t.assignedAgentId}</span>
                                </div>

                                {isHtmlCode ? (
                                  <LiveCodePreview
                                    code={codeSnippet}
                                    language="html"
                                    title={output.title || "HTML Preview"}
                                  />
                                ) : isCode ? (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-neutral-700 flex items-center space-x-1">
                                        <Code2 className="w-3.5 h-3.5 text-neutral-900" />
                                        <span>
                                          {output.title || "Implementation Code"}{" "}
                                          {output.savedFilePath ? `(ไฟล์: ${output.savedFilePath})` : ""}
                                        </span>
                                      </span>
                                      <button
                                        onClick={() => handleCopyCode(codeSnippet, i)}
                                        className="flex items-center space-x-1 bg-neutral-900 text-white px-2 py-1 rounded text-[9px] hover:bg-neutral-800"
                                      >
                                        {copiedTaskIdx === i ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>คัดลอกแล้ว</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Copy Code</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <pre className="p-3 bg-neutral-950 text-neutral-100 rounded text-[10px] font-mono overflow-x-auto leading-relaxed border border-neutral-800 max-h-[350px]">
                                      {codeSnippet}
                                    </pre>
                                  </div>
                                ) : (
                                  output && (
                                    <pre className="p-2.5 bg-neutral-100 rounded text-neutral-800 text-[9px] overflow-x-auto">
                                      {JSON.stringify(output, null, 2)}
                                    </pre>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* LIVE STREAMING RESPONSE BOX (พิมพ์ตอบทีละตัวอักษรแบบ Real-time) */}
            {isStreaming && (
              <div className="flex flex-col items-start">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-neutral-500 mb-1 px-1">
                  <span>{selectedAgent?.name || "Aether (CEO)"}</span>
                  <span>•</span>
                  <span>กำลังพิมพ์สด...</span>
                </div>
                <div className="max-w-[90%] rounded p-3 text-xs leading-relaxed bg-white text-neutral-900 border border-neutral-300 shadow-sm relative">
                  <p className="whitespace-pre-wrap">{streamingText}</p>
                  <span className="inline-block w-2 h-4 bg-neutral-900 animate-pulse align-middle ml-1" />
                </div>
              </div>
            )}

            {loading && !isStreaming && (
              <div className="flex flex-col items-start">
                <div className="bg-white border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-700 flex items-center space-x-2 shadow-sm">
                  <span className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {selectedAgent?.role === "CEO"
                      ? "CEO Aether กำลังวิเคราะห์และสั่งการทีมงานทั้งหมด..."
                      : `${selectedAgent?.name || "AI"} กำลังประมวลผล...`}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached File Preview Chip */}
          {selectedFile && (
            <div className="px-4 py-2 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-neutral-700 shrink-0" />
                <span className="font-semibold text-neutral-900 truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-neutral-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                {isUploading ? (
                  <span className="text-amber-700 text-[10px] animate-pulse">กำลังอ่านไฟล์...</span>
                ) : (
                  <span className="text-emerald-700 text-[10px]">พร้อมให้ AI วิเคราะห์</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setUploadedFileMeta(null);
                }}
                className="p-1 hover:bg-neutral-200 rounded text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Input Bar with File Upload & Stream buttons */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.json,.csv,.ts,.tsx,.js,.html,.css,.sql,.pdf,.md"
              className="hidden"
            />

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="แนบไฟล์เพื่อวิเคราะห์ (.pdf, .csv, .txt, .sql, โค้ด)"
              className="p-2 border border-neutral-300 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                selectedFile
                  ? `พิมพ์คำถามเกี่ยวกับไฟล์ "${selectedFile.name}"...`
                  : `พิมพ์ข้อความ หรือแนบไฟล์เอกสารในหัวข้อ "${activeThreadObj?.title || "แชตนี้"}"...`
              }
              disabled={loading || isStreaming || isUploading}
              className="flex-1 border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-neutral-50 font-sans"
            />

            <button
              type="submit"
              disabled={loading || isStreaming || isUploading || (!inputMessage.trim() && !uploadedFileMeta)}
              className="bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-medium flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{selectedAgent?.role === "CEO" ? "สั่งการ CEO" : "ส่งข้อความ"}</span>
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}
