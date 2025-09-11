// src/components/tabs/AprovacaoTab.jsx

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

export default function AprovacaoTab() {
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function fetchPendentes() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // Chama a Edge Function para listar utilizadores de forma segura
      const { data, error: functionError } = await supabase.functions.invoke('listar-utilizadores-pendentes');
      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      setPendentes(data.users || []);
    } catch (err) {
      setError(`Erro ao carregar utilizadores: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendentes();
  }, []);

  const handleAction = async (userId, newStatus) => {
    try {
      setMessage("");
      // Chama a Edge Function para atualizar o status de forma segura
      const { data, error } = await supabase.functions.invoke('atualizar-status-utilizador', {
        body: { userId, status: newStatus }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessage(`Utilizador ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      // Atualiza a lista na interface, removendo o utilizador que foi processado
      setPendentes(pendentes.filter(u => u.id !== userId));
    } catch (err) {
      setError(`Erro ao ${newStatus === 'aprovado' ? 'aprovar' : 'rejeitar'} utilizador: ${err.message}`);
    }
  };

  if (loading) return <p className="text-center dark:text-gray-200">A carregar registos pendentes...</p>;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 dark:text-white">Aprovações Pendentes</h2>
      {error && <p className="bg-red-200 text-red-800 p-3 rounded-lg mb-4">{error}</p>}
      {message && <p className="bg-green-200 text-green-800 p-3 rounded-lg mb-4">{message}</p>}
      
      {pendentes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Não há registos pendentes de momento.</p>
      ) : (
        <ul className="space-y-4">
          {pendentes.map(user => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="text-sm">
                <p className="font-semibold dark:text-white">{user.email}</p>
                <p className="text-gray-500 dark:text-gray-400">Registado em: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(user.id, 'aprovado')}
                  className="bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-green-600 transition"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleAction(user.id, 'rejeitado')}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 transition"
                >
                  Rejeitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
