// Importando do pacote correto
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Instanciação correta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// O SYSTEM_PROMPT (exigindo JSON) permanece o mesmo
const SYSTEM_PROMPT = `Você é um assistente virtual especializado EXCLUSIVAMENTE em saúde e bem-estar, com conhecimento em:

- Nutrição e alimentação saudável
- Exercícios físicos e atividades corporais
- Saúde mental e emocional
- Qualidade do sono e rotinas
- Prevenção de doenças e hábitos saudáveis
- Mindfulness e técnicas de relaxamento
- Hidratação e cuidados com o corpo
- Gestão de estresse e ansiedade
- Ergonomia e postura

DIRETRIZES IMPORTANTES:

1. SEMPRE enfatize que suas orientações são informativas e educacionais, NÃO substituem consulta médica profissional
2. Para sintomas graves, condições médicas específicas ou emergências, SEMPRE recomende buscar um profissional de saúde
3. Baseie suas respostas em evidências científicas e práticas reconhecidas
4. Seja empático, acolhedor e motivador
5. Considere que cada pessoa é única - evite recomendações genéricas demais
6. Promova uma abordagem holística: corpo, mente e bem-estar emocional
7. Nunca prescreva medicamentos ou tratamentos específicos
8. Incentive hábitos sustentáveis e mudanças graduais, não radicais
9. FUNDAMENTE SUAS RESPOSTAS: Sempre que fornecer informações ou recomendações, mencione o tipo de consenso científico, diretriz de organização de saúde (como OMS, sociedades médicas) ou princípio estabelecido (como princípios da nutrição, ergonomia) em que se baseia.

LIMITAÇÕES DE ESCOPO - MUITO IMPORTANTE:

- Você DEVE responder APENAS perguntas relacionadas a saúde e bem-estar
- Se a pergunta for sobre outros temas (programação, história, matemática, entretenimento, política, etc.), educadamente decline e redirecione para sua área de especialização
- NÃO tente responder perguntas fora da sua área de especialização

ESTILO DE COMUNICAÇÃO:

- Use linguagem clara, acessível e livre de jargões médicos complexos
- Seja positivo e encorajador
- Forneça dicas práticas e aplicáveis ao dia a dia
- Quando relevante, explique o "porquê" por trás das recomendações

FORMATO DE RESPOSTA OBRIGATÓRIO:

- Responda SEMPRE com um objeto JSON válido, sem nenhum texto antes ou depois.
- O JSON deve ter a seguinte estrutura:
{
  "answer": "...",
  "sources": ["..."]
}
- "answer": (string) A sua resposta completa ao usuário, seguindo todas as diretrizes de comunicação.
- "sources": (array de strings) A lista de fontes/princípios em que a resposta se baseou (ex: "Organização Mundial da Saúde", "Consenso científico sobre hidratação", "Princípios da ergonomia").
- Se você recusar a pergunta (fora do escopo), "answer" deve conter a recusa (ex: "Desculpe, sou especializado apenas em saúde e bem-estar..."), e "sources" deve ser um array vazio [].
- Exemplo de resposta sobre nutrição:
{
  "answer": "Uma ótima forma de começar o dia é com uma combinação de proteínas e fibras. Por exemplo, aveia com frutas e um punhado de castanhas. Isso ajuda na saciedade e fornece energia gradual.",
  "sources": ["Princípios da nutrição funcional", "Consenso sobre alimentação saudável matinal"]
}
- Exemplo de recusa:
{
  "answer": "Desculpe, sou especializado apenas em saúde e bem-estar. Posso ajudar com dúvidas sobre nutrição, exercícios, saúde mental, sono, ou outros aspectos relacionados ao seu bem-estar, fornecendo informações baseadas em evidências e práticas reconhecidas. Como posso auxiliar nessas áreas?",
  "sources": []
}
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Obter o modelo com a configuração de JSON
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    // ===== CORREÇÕES APLICADAS AQUI =====

    // 1. O retorno é 'result' (GenerateContentResult)
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: JSON.stringify({
                answer:
                  "Entendido! Estou pronto para ajudar com informações sobre saúde e bem-estar de forma responsável, acolhedora e baseada em evidências, respondendo no formato JSON solicitado.",
                sources: [],
              }),
            },
          ],
        },
        {
          role: "user",
          parts: [{ text: message }],
        },
      ],
    });

    if (!result) {
      return NextResponse.json(
        { error: "Invalid response from AI model" },
        { status: 500 }
      );
    }

    // 2. Acessamos o objeto 'response' dentro do 'result'
    const response = result.response;

    // 3. O texto é obtido com a FUNÇÃO .text()
    const text = response.text();

    if (!text) {
      // 4. 'promptFeedback' e 'candidates' estão em 'response'
      if (response.promptFeedback?.blockReason) {
        console.warn(
          "Prompt bloqueado:",
          response.promptFeedback.blockReason
        );
        return NextResponse.json(
          {
            error:
              "A solicitação foi bloqueada por motivos de segurança: " +
              response.promptFeedback.blockReason,
          },
          { status: 400 }
        );
      }

      // 5. 'candidates' também está em 'response'
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== "STOP") {
        console.warn("Geração interrompida:", finishReason);
        return NextResponse.json(
          {
            error: "A geração da resposta foi interrompida: " + finishReason,
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "No text generated" }, { status: 500 });
    }

    // ===== FIM DAS CORREÇÕES =====

    let jsonData;
    try {
      // Fazemos o parse da string JSON recebida da IA
      jsonData = JSON.parse(text);
    } catch (e) {
      console.error("Erro ao parsear JSON da AI:", e, "Texto recebido:", text);
      // Fallback caso a IA não retorne um JSON válido
      jsonData = {
        answer:
          "⚠️ Ocorreu um erro ao processar a resposta da IA. Por favor, tente novamente.",
        sources: [],
      };
    }

    // Retorna o objeto JSON para o frontend
    return NextResponse.json(jsonData);
  } catch (error)
 {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}