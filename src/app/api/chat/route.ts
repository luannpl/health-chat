// Importando do pacote correto
import { searchHealthSources, HealthSource } from "@/lib/searchHealthSources";
import { GoogleGenerativeAI, Content } from "@google/generative-ai"; // Importe 'Content'
import { NextResponse } from "next/server";

// Instanciação correta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// [MUDANÇA] O System Prompt não precisa mais estar no prompt de texto.
// Ele será injetado diretamente no modelo.
const SYSTEM_PROMPT = `Você é um assistente virtual especializado em saúde e bem-estar, com conhecimento em:

- Nutrição e alimentação saudável
- Exercícios físicos, fitness e hipertrofia
- Saúde mental e emocional
- Qualidade do sono e rotinas
- Prevenção de doenças e hábitos saudáveis
- Mindfulness e técnicas de relaxamento
- Gestão de estresse e ansiedade

DIRETRIZES IMPORTANTES:

1. SEMPRE enfatize que suas orientações são informativas e educacionais, NÃO substituem consulta médica ou de um profissional de educação física.
2. Para sintomas graves ou emergências, SEMPRE recomende buscar um profissional de saúde.
3. Baseie suas respostas em evidências científicas e práticas reconhecidas.
4. Seja empático, acolhedor e motivador.

5. SEJA ESPECÍFICO E PRÁTICO: Quando o usuário pedir exemplos (como exercícios, receitas ou técnicas), **forneça exemplos concretos** (ex: "Elevação Lateral", "Arnold Press", "Agachamento") em vez de apenas conselhos genéricos (ex: "use pesos"). Sempre enquadre-os como sugestões educacionais.

6. Promova uma abordagem holística: corpo, mente e bem-estar emocional.

7. Nunca prescreva medicamentos. Ao sugerir rotinas de exercícios, exemplos de alimentos ou planos de dieta, trate-os como **exemplos educacionais e sugestões informativas**, não como prescrições médicas ou planos de treino individualizados.

8. Incentive hábitos sustentáveis e mudanças graduais.

9. ESTRUTURA DA RESPOSTA (EM DUAS PARTES):
   - **Bloco Principal:** Use seu **conhecimento interno** para dar a resposta mais direta, específica e prática. **Sempre que possível**, ENRIQUEÇA e JUSTIFQUE sua resposta usando informações das fontes de contexto fornecidas. Cite as fontes \`[Fonte X]\` apenas quando usar uma informação diretamente delas.
   - **Parágrafo Final (Separado):** Em um novo parágrafo, adicione os contrapontos, riscos, e o **aviso legal obrigatório** de que suas informações não substituem uma consulta profissional.

LIMITAÇÕES DE ESCOPO - MUITO IMPORTANTE:

- Você DEVE responder APENAS perguntas relacionadas a saúde e bem-estar.
- Se a pergunta for sobre outros temas (programação, história, matemática, etc.), educadamente decline e redirecione para sua área de especialização.

ESTILO DE COMUNICAÇÃO:

- Use linguagem clara, acessível e livre de jargões complexos.
- Seja positivo e encorajador.
- Forneça dicas práticas e aplicáveis ao dia a dia.

FORMATO DE RESPOSTA OBRIGATÓRIO:

- Responda APENAS com o texto da resposta (string pura), sem nenhum JSON.
- A resposta deve ser completa, empática e estruturada em dois blocos de texto separados por uma quebra de linha.
- **NÃO use títulos** como "Resposta Principal" ou "Pontos de Atenção".
- **NÃO use negrito** para os títulos (o negrito pode ser usado no corpo do texto para ênfase).
- O primeiro bloco DEVE conter as citações \`[Fonte X]\` (quando as fontes forem usadas para enriquecer).
- O segundo bloco (contrapontos e aviso) NÃO deve conter citações \`[Fonte X]\`.
`;

// Interface para o histórico que esperamos receber do cliente
interface HistoryItem {
  role: "user" | "model";
  message: string;
}

export async function POST(req: Request) {
  console.log("🟢 [API] Requisição recebida no endpoint /api/chat");

  try {
    const body = await req.json();
    // [MUDANÇA] Recebemos 'message' e 'history' do body
    const { message, history } = body as { message: string, history: HistoryItem[] };

    console.log(`📨 Mensagem recebida: "${message}"`);
    console.log(`⏳ Histórico recebido: ${history?.length || 0} turnos`);

    if (!message) {
      console.warn("⚠️ Nenhuma mensagem foi fornecida.");
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // --- Etapa 1: Sugerir Fontes (Domínios) ---
    // O RAG (busca de fontes) será baseado APENAS na última pergunta do usuário,
    // o que é geralmente mais eficiente.
    const extractionModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "text/plain",
        temperature: 0.0,
      },
    });

    console.log("🧠 [Etapa 1] Solicitando domínios de fontes ao Gemini...");
    const promptSources = `Com base NESTA PERGUNTA de saúde: "${message}", sugira 8-10 domínios de sites de saúde E FITNESS altamente confiáveis.
    - Se a pergunta for sobre **exercício, musculação ou fitness**, inclua domínios como (ex: treinomestre.com.br, hipertrofia.org, exrx.net, bodybuilding.com, tuasaude.com).
    - Se a pergunta for sobre **saúde geral ou medicina**, inclua domínios como (ex: mayoclinic.org, who.int, cdc.gov, tuasaude.com, mdsaude.com, drauziovarella.uol.com.br).
    Responda APENAS com os domínios, separados por vírgula.`;

    const sourcesResult = await extractionModel.generateContent({
      contents: [{ role: "user", parts: [{ text: promptSources }] }],
    });
    const domainsString = sourcesResult.response.text().trim();
    console.log(`🌍 Domínios sugeridos pela LLM: ${domainsString}`);

    // --- Etapa 2: Montar a Query de Busca (RAG) ---
    console.log("🧠 [Etapa 2] Montando query de busca...");
    const domains = domainsString.split(',').map(d => d.trim()).filter(d => d.length > 0);
    
    let finalSearchQuery = message; 
    if (domains.length > 0) {
      const siteQuery = domains.map(d => `site:${d}`).join(' OR ');
      finalSearchQuery = `${message} (${siteQuery})`; 
    }
    console.log(`🔍 Query final para busca (RAG): ${finalSearchQuery}`);

    // --- Etapa 3: Buscar fontes (RAG) ---
    console.log("🌐 [Etapa 3] Iniciando busca online de fontes (RAG)...");
    const sourcesArray: HealthSource[] = await searchHealthSources(finalSearchQuery);
    console.log("✅ Busca concluída. Fontes estruturadas recebidas.");

    // --- Etapa 4: Preparar dados para o prompt final ---
    const contextString = sourcesArray
      .map(
        (s, i) =>
          `[Fonte ${i + 1}]\nTítulo: ${s.title}\nConteúdo: ${s.snippet}\nLink: ${s.link}`
      )
      .join("\n\n");
    const linksArray = sourcesArray.map((s) => s.link);

    // --- Etapa 5: Montar o prompt aumentado final ---
    
    // [MUDANÇA] Formatamos o histórico recebido para o formato do Gemini
    const formattedHistory: Content[] = (history || []).map(item => ({
      role: item.role,
      parts: [{ text: item.message }]
    }));

    // [MUDANÇA] A nova mensagem do usuário é formatada com o contexto RAG
    // O SYSTEM_PROMPT não está mais aqui, ele vai na configuração do modelo.
    const finalUserMessage = `
    Fontes confiáveis encontradas na web (use-as para enriquecer o primeiro bloco de texto, se relevante):
    ---
    ${contextString.length > 0 ? contextString : "Nenhuma fonte encontrada."}
    ---

    INSTRUÇÕES IMPORTANTES:
    1. Siga **exatamente** o FORMATO DE RESPOSTA OBRIGATÓRIO (definido nas instruções do sistema).
    2. Gere o **primeiro bloco de texto** usando seu conhecimento interno e as fontes (citando-as).
    3. Gere o **parágrafo final (separado)** com o aviso legal.

    Pergunta do usuário:
    ${message}
    `;

    // --- Etapa 6: Gerar a Resposta Final (LLM Call 2) ---
    console.log("🧠 [Etapa 6] Enviando prompt e histórico para o Gemini...");
    
    // [MUDANÇA] O System Prompt é passado aqui, na 'systemInstruction'
    const answerModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT, // <-- AQUI
      generationConfig: {
        responseMimeType: "text/plain",
        temperature: 0.2, 
      },
    });

    // [MUDANÇA] Montamos o array de 'contents' com o histórico + nova mensagem
    const contents: Content[] = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: finalUserMessage }] }
    ];

    const result = await answerModel.generateContent({
      contents: contents, // <-- Passa o histórico completo
    });

    const response = result.response;
    const modelAnswer = response.text();
    console.log("📩 Resposta (texto puro) recebida do Gemini");

    // --- Etapa 7: Montar o JSON final ---
    const jsonData = {
      answer: modelAnswer.trim(),
      sources: linksArray,
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