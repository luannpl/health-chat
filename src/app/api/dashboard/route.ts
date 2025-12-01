import { connectToDB } from "@/lib/mongoose";
import { FeedBack } from "@/models/FeedBack";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Buscar todos os feedbacks
    const feedbacks = await FeedBack.find({});

    // Calcular estatísticas
    const totalResponses = feedbacks.length;
    const fiveStarCount = feedbacks.filter((fb) => fb.rate === 5).length;
    const oneStarCount = feedbacks.filter((fb) => fb.rate === 1).length;
    
    // Calcular média
    const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rate, 0);
    const averageRating = totalResponses > 0 ? totalRating / totalResponses : 0;

    return NextResponse.json({
      totalResponses,
      fiveStarCount,
      oneStarCount,
      averageRating,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
