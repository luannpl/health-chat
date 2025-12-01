"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Star,
  TrendingUp,
  MessageSquare,
  User,
  Quote,
} from "lucide-react";

interface DashboardStats {
  totalResponses: number;
  fiveStarCount: number;
  oneStarCount: number;
  averageRating: number;
}

interface Testimonial {
  id: string;
  userName: string;
  feedback: string;
  rating: number;
  date: string;
}

// Depoimentos mockados dos usuários
const mockTestimonials: Testimonial[] = [
  {
    id: "1",
    userName: "Maria Silva",
    feedback: "Usei e gostei muito! Tirou minha dúvida sobre alimentação saudável de forma clara e objetiva.",
    rating: 5,
    date: "2025-11-28",
  },
  {
    id: "2",
    userName: "João Santos",
    feedback: "Excelente assistente! Me ajudou a entender melhor sobre exercícios físicos e como começar uma rotina.",
    rating: 5,
    date: "2025-11-27",
  },
  {
    id: "3",
    userName: "Ana Costa",
    feedback: "Muito útil! As respostas são bem detalhadas e me ajudaram a melhorar minha qualidade de vida.",
    rating: 5,
    date: "2025-11-26",
  },
  {
    id: "4",
    userName: "Pedro Oliveira",
    feedback: "Adorei a experiência! O chat é intuitivo e as informações sobre saúde mental foram muito valiosas.",
    rating: 5,
    date: "2025-11-25",
  },
  {
    id: "5",
    userName: "Carla Mendes",
    feedback: "Recomendo! Me ajudou com dicas de como melhorar meu sono e reduzir o estresse do dia a dia.",
    rating: 5,
    date: "2025-11-24",
  },
  {
    id: "6",
    userName: "Lucas Ferreira",
    feedback: "Ótimo serviço! As orientações sobre nutrição foram esclarecedoras e fáceis de entender.",
    rating: 5,
    date: "2025-11-23",
  },
];

export default function DashPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResponses: 0,
    fiveStarCount: 0,
    oneStarCount: 0,
    averageRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Respostas",
      value: stats.totalResponses,
      icon: MessageSquare,
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Avaliações 5 Estrelas",
      value: stats.fiveStarCount,
      icon: Star,
      color: "from-yellow-400 to-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Avaliações 1 Estrela",
      value: stats.oneStarCount,
      icon: TrendingUp,
      color: "from-red-400 to-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Média Geral",
      value: stats.averageRating.toFixed(2),
      icon: BarChart3,
      color: "from-teal-400 to-cyan-400",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 shadow-md">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-teal-500">
                Dashboard de Feedback
              </h1>
              <p className="text-sm text-gray-500">
                Análise de avaliações do HealthChat
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Statistics Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {isLoading ? (
                        <span className="inline-block h-8 w-16 animate-pulse rounded bg-gray-200" />
                      ) : (
                        card.value
                      )}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${card.color} transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100`}
                />
              </div>
            ))}
          </div>

          {/* Testimonials Section */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Depoimentos dos Usuários
              </h2>
              <p className="text-sm text-gray-500">
                Feedback e experiências compartilhadas pelos usuários do HealthChat
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mockTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-teal-50/30 p-5 transition-all duration-300 hover:shadow-lg hover:border-teal-300"
                >
                  {/* Quote Icon */}
                  <div className="absolute top-3 right-3 opacity-10">
                    <Quote className="h-12 w-12 text-teal-500" />
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {testimonial.userName}
                      </h3>
                      <div className="flex items-center gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-3 relative z-10">
                    &quot;{testimonial.feedback}&quot;
                  </p>

                  {/* Date */}
                  <p className="text-xs text-gray-500">
                    {new Date(testimonial.date).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
