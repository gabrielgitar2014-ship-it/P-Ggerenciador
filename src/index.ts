// supabase/functions/generate-embeddings/index.ts
// Este é o "worker" que processa a 'embedding_queue'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
// Modelo e API (baseado no que funcionou no seu backfill.py)
const EMBEDDING_MODEL = "gemini-embedding-001";
const API_MODEL_NAME = "models/embedding-001";
const TASK_TYPE = "RETRIEVAL_DOCUMENT";
const BATCH_SIZE = 50; // Processa 50 itens da fila de cada vez
serve(async (_req)=>{
  try {
    // 1. Inicializa o cliente Admin do Supabase
    const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // 2. Inicializa o cliente do Gemini
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY"));
    // 3. Busca um lote de itens da fila 'embedding_queue'
    console.log("Buscando itens na 'embedding_queue'...");
    const { data: itemsInQueue, error: queueError } = await supabase.from("embedding_queue").select("*").limit(BATCH_SIZE);
    if (queueError) throw queueError;
    if (!itemsInQueue || itemsInQueue.length === 0) {
      console.log("Fila de embedding vazia. Saindo.");
      return new Response(JSON.stringify({
        message: "Fila vazia."
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    console.log(`Encontrados ${itemsInQueue.length} itens na fila. Começando o embedding...`);
    // 4. Prepara os textos para o embedding (Categoria + Descrição)
    const textsToEmbed = itemsInQueue.map((item)=>{
      const category = item.category || "Sem Categoria";
      const description = item.description || "Sem Descrição";
      return `Categoria: ${category}, Descrição: ${description}`;
    });
    // 5. Chama a API de Embedding do Gemini
    const result = await genAI.embed_content({
      model: API_MODEL_NAME,
      content: textsToEmbed,
      task_type: TASK_TYPE
    });
    const embeddings = result.embedding;
    // 6. Prepara as linhas para salvar na tabela principal 'financial_embeddings'
    const rowsToInsert = itemsInQueue.map((item, index)=>({
        date: item.date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        source_table: item.source_table,
        embedding: embeddings[index] // O vetor de 768 dimensões
      }));
    // 7. Salva o lote vetorizado no banco
    console.log(`Salvando ${rowsToInsert.length} novos vetores (dimensão: ${embeddings[0].length}) em 'financial_embeddings'...`);
    const { error: insertError } = await supabase.from("financial_embeddings").insert(rowsToInsert);
    if (insertError) {
      console.error("Erro ao salvar vetores:", insertError);
      throw insertError;
    }
    // 8. (IMPORTANTE) Limpa os itens processados da fila
    console.log("Limpando itens processados da fila...");
    const idsToDelete = itemsInQueue.map((item)=>item.id);
    const { error: deleteError } = await supabase.from("embedding_queue").delete().in("id", idsToDelete);
    if (deleteError) {
      console.error("Erro CRÍTICO: Não foi possível limpar a fila. Itens podem ser processados novamente.", deleteError);
      throw deleteError;
    }
    console.log("Processo de embedding concluído com sucesso!");
    return new Response(JSON.stringify({
      success: true,
      processed_items: itemsInQueue.length
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Erro inesperado na função 'generate-embeddings':", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
