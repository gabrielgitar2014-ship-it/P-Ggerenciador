import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function CardConfigModal({ isOpen, onClose, onSave, cardName, initialConfig }) {
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setClosingDay(initialConfig.closing_day || '');
      setDueDay(initialConfig.due_day || '');
    } else {
      setClosingDay('');
      setDueDay('');
    }
  }, [initialConfig, isOpen]);

  const handleSave = async () => {
    if (!closingDay || !dueDay) {
      alert('Por favor, preencha ambos os campos.');
      return;
    }

    setIsSaving(true);
    const configData = {
      card_name: cardName,
      closing_day: parseInt(closingDay, 10),
      due_day: parseInt(dueDay, 10),
    };

    try {
      const { error } = await supabase.from('card_configs').upsert(configData);

      // Se houver um erro, ele será "lançado" e capturado pelo bloco catch
      if (error) throw error;

      alert('Configurações salvas com sucesso!');
      onSave();
      onClose();

    } catch (error) {
      // --- LOG DE ERRO ADICIONADO AQUI ---
      console.error("Erro detalhado do Supabase:", error);
      alert(`Ocorreu um erro ao salvar as configurações: ${error.message}\n\nVerifique o console para mais detalhes.`);
    
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Configurar Cartão: {cardName}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Dia do Fechamento da Fatura</label>
            <input
              type="number"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              placeholder="Ex: 28"
              min="1"
              max="31"
              className="mt-1 block w-full p-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">O dia em que a fatura fecha para compras.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Dia do Vencimento da Fatura</label>
            <input
              type="number"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              placeholder="Ex: 10"
              min="1"
              max="31"
              className="mt-1 block w-full p-2 border rounded-md"
            />
             <p className="text-xs text-gray-500 mt-1">O dia em que você paga a fatura.</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-md">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="py-2 px-4 bg-blue-600 text-white rounded-md disabled:bg-blue-400">
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}