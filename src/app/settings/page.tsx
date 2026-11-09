"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/layout/shell";
import { Settings, Shield, Cpu, Key, Database, CheckCircle2, Sparkles, Lock } from "lucide-react";

export default function SettingsPage() {
  const [providers, setProviders] = useState<any>({
    gemini: { configured: false, maskedKey: null },
    openai: { configured: false, maskedKey: null },
    anthropic: { configured: false, maskedKey: null },
  });

  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [anthropicKeyInput, setAnthropicKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || {});
      }
    } catch {}
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geminiApiKey: geminiKeyInput.trim() || undefined,
          openaiApiKey: openaiKeyInput.trim() || undefined,
          anthropicApiKey: anthropicKeyInput.trim() || undefined,
        }),
      });

      if (res.ok) {
        setStatusMessage("บันทึก API Key ฝั่งเซิร์ฟเวอร์สำเร็จ! ระบบจะเรียกใช้งานโมเดลจริงทันที");
        setGeminiKeyInput("");
        setOpenaiKeyInput("");
        setAnthropicKeyInput("");
        loadSettings();
      } else {
        alert("ไม่สามารถบันทึกได้");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="border-b border-neutral-300 pb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-neutral-800" />
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">
              AI Brain & Gemini Integration Settings
            </h2>
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            ตั้งค่า API Key เพื่อเชื่อมต่อระบบสมองเข้ากับ Google Gemini (หรือ OpenAI / Anthropic) เพื่อให้ถามตอบได้ฉลาดรอบรู้ทุกเรื่อง 100%
          </p>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-xs flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form to Input API Keys */}
          <div className="border border-neutral-300 bg-white p-5 rounded space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-neutral-800" />
                <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wide">
                  ใส่ Gemini API Key เพื่อเปิดใช้งานสมอง Gemini เต็มตัว
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Server-side Protected</span>
              </span>
            </div>

            <form onSubmit={handleSaveKeys} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-800 mb-1">
                  Google Gemini API Key:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder={
                      providers.gemini?.configured
                        ? `เชื่อมต่อแล้ว (${providers.gemini.maskedKey}) - กรอกใหม่เพื่อเปลี่ยน`
                        : "ใส่ AIzaSy... (รับฟรีได้จาก Google AI Studio)"
                    }
                    className="flex-1 border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-neutral-50 font-mono"
                  />
                  {providers.gemini?.configured && (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  * สมัครขอรับ API Key ฟรีได้ทันทีที่:{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-900 underline font-semibold"
                  >
                    https://aistudio.google.com/apikey
                  </a>
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <label className="block font-semibold text-neutral-700 mb-1">
                  OpenAI API Key (ตัวเลือกเสริม):
                </label>
                <input
                  type="password"
                  value={openaiKeyInput}
                  onChange={(e) => setOpenaiKeyInput(e.target.value)}
                  placeholder={
                    providers.openai?.configured
                      ? `เชื่อมต่อแล้ว (${providers.openai.maskedKey})`
                      : "sk-..."
                  }
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-neutral-50 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-neutral-200">
                <label className="block font-semibold text-neutral-700 mb-1">
                  Anthropic Claude API Key (ตัวเลือกเสริม):
                </label>
                <input
                  type="password"
                  value={anthropicKeyInput}
                  onChange={(e) => setAnthropicKeyInput(e.target.value)}
                  placeholder={
                    providers.anthropic?.configured
                      ? `เชื่อมต่อแล้ว (${providers.anthropic.maskedKey})`
                      : "sk-ant-..."
                  }
                  className="w-full border border-neutral-300 rounded px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 bg-neutral-50 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || (!geminiKeyInput && !openaiKeyInput && !anthropicKeyInput)}
                  className="bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-medium flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{saving ? "กำลังบันทึก..." : "เปิดใช้งานการเชื่อมต่อ Gemini"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Explanation Card */}
          <div className="border border-neutral-300 bg-white p-5 rounded space-y-4 shadow-xs text-xs">
            <div className="flex items-center space-x-2 border-b border-neutral-200 pb-3">
              <Cpu className="w-4 h-4 text-neutral-800" />
              <h3 className="font-bold text-neutral-900 uppercase tracking-wide">
                เมื่อเชื่อมต่อ Gemini แล้ว ระบบจะทำอะไรได้บ้าง?
              </h3>
            </div>

            <div className="space-y-2.5 text-neutral-700 leading-relaxed">
              <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1">
                <div className="font-bold text-neutral-900">🧠 1. ถามตอบได้ทุกเรื่องเหมือนคุยกับ Gemini โดยตรง:</div>
                <p className="text-[11px] text-neutral-600">
                  ไม่ว่าจะเป็นการถามความรู้รอบตัว, ให้เขียนบทความ, แปลภาษา, แต่งอีเมล, วิเคราะห์ข้อมูล หรือสอนเขียนโค้ดภาษาใดๆ ก็ตาม Gemini จะตอบให้แบบสดๆ เรียลไทม์
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1">
                <div className="font-bold text-neutral-900">⚡ 2. พลัง CEO Orchestrator + Gemini LLM:</div>
                <p className="text-[11px] text-neutral-600">
                  CEO Aether จะใช้สมองของ **Gemini 1.5 Flash/Pro** ในการแตกงานวิศวกรรมที่ซับซ้อน เขียนโค้ดระบบแบบโปร และตรวจสอบคุณภาพผ่าน QA โดยไม่ต้องพึ่งข้อความที่ตั้งไว้ล่วงหน้า
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded border border-neutral-200 space-y-1">
                <div className="font-bold text-neutral-900">🛡️ 3. ปลอดภัยระดับสูงสุด:</div>
                <p className="text-[11px] text-neutral-600">
                  Key ของท่านจะถูกเก็บไว้ที่ไฟล์ `.env.local` ในเครื่องของท่านเท่านั้น ไม่มีการส่ง Key ออกไปที่เบราว์เซอร์หรือบุคคลภายนอกเด็ดขาด
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
