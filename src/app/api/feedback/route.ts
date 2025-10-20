import { connectToDB } from "@/lib/mongoose";
import { FeedBack } from "@/models/FeedBack";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectToDB();

  const body: { rate: number; feedback?: string } = await req.json();
  const { rate, feedback } = body;
  console.log("Recebido feedback:", { rate, feedback });
  if (rate === undefined) {
    return NextResponse.json({ error: "Rate é obrigatório" }, { status: 400 });
  }

  const feedbackDoc = await FeedBack.create({
    rate,
    feedback
  });

  return NextResponse.json(feedbackDoc, { status: 201 });
}
