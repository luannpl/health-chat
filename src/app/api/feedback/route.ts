import { connectToDB } from "@/lib/mongoose";
import { FeedBack } from "@/models/FeedBack";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectToDB();

  const body: { like: number; feedback?: string } = await req.json();
  const { like, feedback } = body;
  if (like === undefined) {
    return NextResponse.json({ error: "Like é obrigatória" }, { status: 400 });
  }

  const feedbackDoc = await FeedBack.create({
    like,
    feedback,
  });

  return NextResponse.json(feedbackDoc, { status: 201 });
}
