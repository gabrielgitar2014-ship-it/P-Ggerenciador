import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';
import { ArrowLeft, Wallet } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Função auxiliar para formatar moeda
const valueFormatter = (number) => `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(number || 0)}`;

export default function CategoryDetailPage({ categoryName, dateRange, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!categoryName || !dateRange?.from || !dateRange?.to) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      // --- CORREÇÃO APLICADA AQUI ---
      // Adicionamos "!inner" para garantir que a junção com a tabela "despesas" seja feita
      // e o filtro por categoria funcione corretamente.
      const { data, error } = await supabase
        .from('parcelas')
        .select(`
          id,
          amount,
          data_parcela,
          despesas!inner (
            description,
            category
          )
        `)
        .eq('despesas.category', categoryName)
        .gte('data_parcela', startDate)
        .lte('data_parcela', endDate)
        .order('data_parcela', { ascending: false });

      if (error) {
        console.error("Erro ao buscar detalhes da categoria:", error);
        setIsLoading(false);
        return;
      }

      setExpenses(data);
      const totalValue = data.reduce((sum, item) => sum + item.amount, 0);
      setTotal(totalValue);
      setIsLoading(false);
    };

    fetchCategoryDetails();
  }, [categoryName, dateRange]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in-down dark text-slate-50 bg-slate-900">
      {/* Cabeçalho da Página */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <p className="text-sm text-slate-400">Despesas da Categoria</p>
          <h1 className="text-2xl font-bold text-slate-100">{categoryName}</h1>
        </div>
      </div>

      {/* Cartão de Resumo */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Total Gasto no Período</CardTitle>
          <Wallet className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32 rounded-md bg-slate-800" />
          ) : (
            <div className="text-2xl font-bold text-emerald-400">{valueFormatter(total)}</div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Despesas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-200">Lançamentos</h2>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg bg-slate-800" />
            <Skeleton className="h-16 w-full rounded-lg bg-slate-800" />
            <Skeleton className="h-16 w-full rounded-lg bg-slate-800" />
          </div>
        ) : expenses.length > 0 ? (
          expenses.map(expense => (
            <div key={expense.id} className="flex justify-between items-center bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
              <div>
                <p className="font-semibold text-slate-100">
                  {/* Agora o optional chaining (?.) serve apenas como uma segurança extra */}
                  {expense.despesas?.description || 'Descrição não disponível'}
                </p>
                <p className="text-sm text-slate-400">{format(new Date(expense.data_parcela), 'dd/MM/yyyy')}</p>
              </div>
              <p className="font-bold text-lg text-red-400">{valueFormatter(expense.amount)}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-4">Nenhuma despesa encontrada nesta categoria para o período selecionado.</p>
        )}
      </div>
    </div>
  );
}