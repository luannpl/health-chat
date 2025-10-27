/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Exportamos este tipo para ser usado no route.ts
export interface HealthSource {
  title: string;
  snippet: string;
  link: string;
}

// =======================================================================
// MODIFICADO: LISTA DE FONTES CONFIÁVEIS
// Adicionamos muito mais sites de alta autoridade.
// ===============================================================  ========
const TRUSTED_SITES = [
  // Globais / Organizações
  "who.int", // Organização Mundial da Saúde
  "opas.org.br", // Organização Pan-Americana da Saúde (braço da OMS no Brasil)
  "fiocruz.br", // Fundação Oswaldo Cruz

  // Governo
  "saude.gov.br", // Ministério da Saúde do Brasil
  "bvs.saude.gov.br", // Biblioteca Virtual em Saúde (do Min. Saúde)
  "www.gov.br/anvisa", // Agência Nacional de Vigilância Sanitária
  "www.gov.br/ans", // Agência Nacional de Saúde Suplementar
  "inca.gov.br", // Instituto Nacional de Câncer

  // Hospitais de Referência
  "einstein.br", // Hospital Albert Einstein
  "hcor.com.br", // Hospital do Coração
  "hcfmusp.org.br", // Hospital das Clínicas da USP
  "hospitaloswaldocruz.org.br", // Hospital Alemão Oswaldo Cruz

  // Conteúdo de Alta Curadoria
  "drauziovarella.uol.com.br", // Portal Drauzio Varella
];
// =======================================================================

// MODIFICADO: A função agora usa a lista TRUSTED_SITES
async function webSearch(query: string): Promise<HealthSource[]> {
  console.log("🔍 [Search] Iniciando busca na web com query:", query);

  // 1. Constrói a string de busca dinamicamente
  const siteQuery = TRUSTED_SITES.map(site => `site:${site}`).join(" OR ");

  console.log(`ℹ️ [Search] Buscando em ${TRUSTED_SITES.length} sites confiáveis.`);

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": process.env.SERPER_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${query} ${siteQuery}`,
        num: 5, // Pedimos 5 resultados principais
      }),
    });

    const data = await response.json();

    if (!data.organic?.length) {
      console.warn("⚠️ [Search] Nenhum resultado orgânico encontrado para:", query);
      return []; // Retorna array vazio
    }

    // Mapeia para o tipo HealthSource
    const results: HealthSource[] = data.organic.map((r: any) => ({
      title: r.title,
      snippet: r.snippet,
      link: r.link,
    }));

    console.log("✅ [Search] Resultados estruturados obtidos com sucesso.");
    return results;
  } catch (err) {
    console.error("❌ [Search] Erro ao buscar na web:", err);
    return []; // Retorna array vazio em caso de erro
  }
}

// Função principal (sem alteração de lógica)
export async function searchHealthSources(
  question: string
): Promise<HealthSource[]> {
  console.log("🧩 [Search] Extraindo palavras-chave da PERGUNTA com Gemini...");

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const keywordPrompt = `
Extraia as principais palavras-chave da seguinte pergunta sobre saúde e bem-estar.
Responda apenas com uma lista separada por vírgulas.
Pergunta: "${question}"
`;

    const result = await model.generateContent(keywordPrompt);
    const keywords = result.response.text().trim();

    console.log("🔑 [Search] Palavras-chave extraídas:", keywords);

    const searchResults = await webSearch(keywords);

    console.log("📚 [Search] Resultados de busca estruturados retornados.");
    return searchResults; // Retorna o array de objetos
  } catch (error) {
    console.error("🚨 [Search] Erro durante a busca de fontes:", error);
    return [];
  }
}