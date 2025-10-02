import { NextResponse } from "next/server";
import ollama from "ollama";

export async function GET() {
  return NextResponse.json({ message: "Hello from agent!" });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { message } = body;

  const response = await ollama.chat({
    model: "gemma3:1b",
    messages: [{ role: "user", content: message }],
  });

  return new NextResponse(response.message.content, { status: 200 });
}
