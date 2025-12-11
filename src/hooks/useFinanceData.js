import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useFinanceData() {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // 1. BUSCAR CARTÕES/CONTAS
        // Tabela: metodos_pagamento | Coluna: nome
        const { data: metodosData, error: metodosError } = await supabase
          .from('metodos_pagamento')
          .select('id, nome, tipo')
          .order('nome'); // Ordena por 'nome' (português)

        if (metodosError) {
            console.error('Erro ao buscar metodos:', metodosError);
        }

        const mappedAccounts = (metodosData || []).map(m => ({
          id: m.id,
          name: m.nome, // Mapeia para 'name' para o frontend entender
          type: m.tipo
        }));
        
        setAccounts(mappedAccounts);

        // 2. BUSCAR CATEGORIAS
        // Tabela: categorias | Coluna: nome
        const { data: catData, error: catError } = await supabase
          .from('categorias')
          .select('id, nome')
          .order('nome'); // Ordena por 'nome' (português)

        if (catError) {
            console.error('Erro ao buscar categorias:', catError);
        }

        const mappedCategories = (catData || []).map(c => ({
          id: c.id,
          name: c.nome, // Mapeia para 'name'
          color: c.cor || null
        }));

        setCategories(mappedCategories);

      } catch (error) {
        console.error('Erro geral no useFinanceData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { accounts, categories, loading };
}
