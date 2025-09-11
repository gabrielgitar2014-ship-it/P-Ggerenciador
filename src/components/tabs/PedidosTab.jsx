// src/components/tabs/PedidosTab.jsx

import { useState } from "react";
import { useData } from "../../context/DataContext";
import { supabase } from "../../supabaseClient";
import NewPedidoModal from "../modals/NewPedidoModal";

export default function PedidosTab() {
  const { pedidos, fetchData } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState(null);

  // ... (funções 'handle' permanecem as mesmas) ...
  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: 'aprovado' })
      .eq('id', id);
    if (error) alert(`Erro: ${error.message}`);
    else fetchData(); 
  };

  const handleDecline = async (id) => {
    const reason = prompt("Por favor, informe o motivo da recusa:");
    if (reason) {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'recusado', decline_reason: reason })
        .eq('id', id);
      if (error) alert(`Erro: ${error.message}`);
      else fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este pedido?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) alert(`Erro: ${error.message}`);
      else fetchData();
    }
  };

  const handleEdit = (pedido) => {
    setEditingPedido(pedido);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPedido(null);
    setIsModalOpen(true);
  };

  const handleSavePedido = async (pedidoData) => {
    let error;
    if (editingPedido) {
      const { error: updateError } = await supabase
        .from('pedidos')
        .update(pedidoData)
        .eq('id', editingPedido.id);
      error = updateError;
    } else {
      const dataToInsert = { ...pedidoData, status: 'pendente' };
      const { error: insertError } = await supabase
        .from('pedidos')
        .insert([dataToInsert]);
      error = insertError;
    }

    if (error) {
      alert(`Erro ao salvar pedido: ${error.message}`);
    } else {
      fetchData();
      setIsModalOpen(false);
      setEditingPedido(null);
    }
  };


  const formatCurrency = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  
  const getStatusStyle = (status) => {
    if (status === "aprovado") return "bg-green-100 text-green-800 border-green-200";
    if (status === "recusado") return "bg-red-100 text-red-800 border-red-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  return (
    <>
      <NewPedidoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSavePedido} pedidoToEdit={editingPedido} />

      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Pedidos de Compra</h2>
          <button onClick={handleNew} className="flex items-center gap-2 bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-md">
            <span className="material-symbols-outlined">add_shopping_cart</span>
            Novo Pedido
          </button>
        </div>

        <div className="space-y-4">
          {pedidos.length === 0 ? (
             <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-5 rounded-2xl">Nenhum pedido encontrado.</div>
          ) : (
            pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-black/5 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 break-words">{pedido.justification}</p>
                      <p className="font-bold text-purple-600 dark:text-purple-400 text-xl">{formatCurrency(pedido.value)}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(pedido.status)}`}>
                      {pedido.status}
                    </span>
                  </div>
                  {pedido.status === "recusado" && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
                      <b>Motivo:</b> {pedido.decline_reason}
                    </div>
                  )}
                </div>

                {pedido.status === "pendente" && (
                  <div className="flex flex-wrap justify-end gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={() => handleDelete(pedido.id)} className="flex items-center gap-1 px-3 py-1 bg-slate-500 text-white text-sm rounded-md hover:bg-slate-600 transition-colors"><span className="material-symbols-outlined text-base">delete</span>Excluir</button>
                    <button onClick={() => handleEdit(pedido)} className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors"><span className="material-symbols-outlined text-base">edit</span>Editar</button>
                    <button onClick={() => handleDecline(pedido.id)} className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"><span className="material-symbols-outlined text-base">thumb_down</span>Recusar</button>
                    <button onClick={() => handleApprove(pedido.id)} className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"><span className="material-symbols-outlined text-base">thumb_up</span>Aprovar</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}