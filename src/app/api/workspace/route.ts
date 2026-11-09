import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CommunicationBus } from "@/core/communications/comm-bus";

export async function GET() {
  const messages = CommunicationBus.listMessages();
  const handoffs = Array.from(db.handoffs.values());
  const reviews = Array.from(db.reviews.values());

  return NextResponse.json({
    messages,
    handoffs,
    reviews,
  });
}
