import { NextResponse } from "next/server";
import { MemoryStore } from "@/core/memory/memory-store";

export async function GET() {
  const knowledge = MemoryStore.listKnowledge();
  const cases = MemoryStore.listCaseMemories();

  return NextResponse.json({
    knowledge,
    cases,
  });
}
