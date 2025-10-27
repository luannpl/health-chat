// Importando do pacote correto
import { searchHealthSources, HealthSource } from "@/lib/searchHealthSources";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Instanciação correta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// MODIFICADO: O system prompt foi ajustado para remover os títulos
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

9. MODIFICADO: FUNDAMENTE SUAS RESPOSTAS (EM DUAS PARTES):
   - **Primeiro Bloco de Texto:** A resposta inicial DEVE ser baseada **EXCLUSIVAMENTE** nas fontes de contexto fornecidas. **Sempre que usar uma informação de uma fonte, cite-a** usando o formato \`[Fonte X]\`.
   - **Parágrafo Final (Separado):** Após a resposta factual (e em um novo parágrafo), adicione os contrapontos. Nesta parte, use seu **conhecimento interno** para fornecer riscos, ou visões alternativas que não estavam nas fontes.

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

- Responda APENAS com o texto da resposta (string pura), sem nenhum JSON.
- A resposta deve ser completa, empática e estruturada em dois blocos de texto separados por uma quebra de linha.
- **NÃO use títulos** como "Resposta Principal" ou "Pontos de Atenção".
- **NÃO use negrito** para os títulos.
- O primeiro bloco NÃO DEVE conter as citações \`[Fonte X]\`.
- O segundo bloco (contrapontos) NÃO deve conter citações \`[Fonte X]\`.
`;

export async function POST(req: Request) {
  console.log("🟢 [API] Requisição recebida no endpoint /api/chat");

  try {
    const body = await req.json();
    const { message } = body;

    console.log("📨 Mensagem recebida do usuário");

    if (!message) {
      console.warn("⚠️ Nenhuma mensagem foi fornecida.");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Etapa 1: Buscar fontes ANTES (RAG)
    console.log("🌐 [Etapa 1] Iniciando busca online de fontes (RAG)...");
    const sourcesArray: HealthSource[] = await searchHealthSources(message);
    console.log("✅ Busca concluída. Fontes estruturadas recebidas.");

    // Etapa 2: Preparar dados para o prompt e para a resposta final

    // Formata os snippets para o modelo LER (para a "Resposta Principal")
    const contextString = sourcesArray
      .map(
        (s, i) =>
          `[Fonte ${i + 1}]\nTítulo: ${s.title}\nConteúdo: ${s.snippet}\nLink: ${s.link}`
      )
      .join("\n\n");

    // Extrai os links para a resposta JSON final (lógica inalterada)
    const linksArray = sourcesArray.map((s) => s.link);

    // Etapa 3: Montar o prompt aumentado
    // MODIFICADO: Instruções reforçam para NÃO USAR TÍTULOS
    const promptWithSources = `
    ${SYSTEM_PROMPT}

    Fontes confiáveis encontradas na web (use-as para o primeiro bloco de texto):
    ---
    ${contextString.length > 0 ? contextString : "Nenhuma fonte encontrada."}
    ---

    INSTRUÇÕES IMPORTANTES:
    1. Siga **exatamente** o FORMATO DE RESPOSTA OBRIGATÓRIO.
    2. Gere o **primeiro bloco de texto** baseando-se estritamente nas fontes acima e citando-as.
    3. Gere o **parágrafo final (separado)** usando seu conhecimento geral sobre saúde para adicionar nuances (contrapontos).
    4. **NÃO USE TÍTULOS** como "Resposta Principal" ou "Pontos de Atenção (Contra-argumentos)".

    Pergunta do usuário:
    ${message}
    `;

    console.log("🧠 [Etapa 2] Enviando prompt aumentado para o Gemini...");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // Esperamos texto puro, não JSON!
      generationConfig: {
        responseMimeType: "text/plain",
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptWithSources }] }],
    });

    const response = result.response;
    const modelAnswer = response.text(); // A resposta agora terá as duas seções

    console.log("📩 Resposta (texto puro) recebida do Gemini");

    // Etapa 4: Montar o JSON final manually (lógica inalterada)
    // Nós combinamos a resposta do modelo com os links que já tínhamos.
    const jsonData = {
      answer: modelAnswer.trim(),
      sources: linksArray, // Anexa os links que encontramos na Etapa 1
    };

    console.log("✅ JSON final montado manualmente");

    return NextResponse.json(jsonData);
  } catch (error) {
    console.error("🚨 Erro geral no processamento da rota /api/chat:", error);
    return NextResponse.json(
      {
        answer: "Ocorreu um erro interno ao processar sua solicitação.",
        sources: [],
      },
      { status: 500 }
    );
  }
}