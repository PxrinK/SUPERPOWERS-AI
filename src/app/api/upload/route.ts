import { NextResponse } from "next/server";
import { AutonomousExecutor } from "@/core/execution/autonomous-executor";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const fileType = file.type || "application/octet-stream";
    const fileSize = file.size;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // 1. Text/Code/Markdown/JSON/CSV
    if (
      fileType.includes("text") ||
      fileType.includes("json") ||
      fileType.includes("csv") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".json") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".tsx") ||
      fileName.endsWith(".js") ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".css") ||
      fileName.endsWith(".sql") ||
      fileName.endsWith(".md")
    ) {
      extractedText = buffer.toString("utf8");
    } else if (fileName.endsWith(".pdf") || fileType.includes("pdf")) {
      try {
        // PDF parsing
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "No readable text extracted from PDF.";
      } catch (err: any) {
        extractedText = `PDF Parse Notice: Uploaded ${fileName} (${fileSize} bytes). Direct text extraction encountered binary format.`;
      }
    } else {
      // General binary file fallback
      extractedText = `Uploaded document: ${fileName} (${fileSize} bytes, type: ${fileType}).`;
    }

    // Save uploaded file into project uploads folder autonomously
    const savedPath = `uploads/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await AutonomousExecutor.writeFile(savedPath, buffer.toString("utf8"));

    return NextResponse.json({
      success: true,
      file: {
        name: fileName,
        size: fileSize,
        type: fileType,
        savedPath,
        contentSample: extractedText.slice(0, 15000), // Up to 15,000 characters for LLM context
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upload failed", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
