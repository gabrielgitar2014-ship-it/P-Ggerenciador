// src/components/CartaoPersonalizado.jsx

import React from 'react';
import { Wifi, Radio } from 'lucide-react';
import { FaCcMastercard, FaCcVisa } from 'react-icons/fa';

// ✅ Lógica do Elo foi completamente removida daqui.

const CartaoPersonalizado = ({ banco, saldo, isSelected, onClick }) => {
  // O objeto de bandeiras agora só tem as que você usa.
  const bandeiras = {
    mastercard: <FaCcMastercard size={32} />,
    visa: <FaCcVisa size={32} />,
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-72 h-44 rounded-xl text-white p-5 flex flex-col justify-between shrink-0 transition-all duration-300 cursor-pointer
                  ${isSelected ? 'transform scale-105 shadow-2xl ring-2 ring-primary ring-offset-2' : 'shadow-lg'} 
                  ${banco.cor}`}
    >
      <div className="absolute inset-0 bg-black/10 rounded-xl"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <span className="font-semibold">{banco.nome}</span>
        {/* Mostra o ícone de Wifi apenas se não for PIX */}
        {banco.bandeira !== 'pix' && <Wifi className="h-6 w-6" />}
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-1">
          {/* Mostra o 'chip' apenas se não for PIX */}
          {banco.bandeira !== 'pix' && <Radio className="h-8 w-8 text-yellow-300/80 mt-1" />}
          
          <div className="text-md font-mono tracking-widest leading-tight">
            {/* Lógica para múltiplos números (continua igual) */}
            {Array.isArray(banco.ultimos_digitos) ? (
              banco.ultimos_digitos.map(digitos => (
                <div key={digitos}>•••• •••• •••• {digitos}</div>
              ))
            ) : (
              // Mostra os dígitos apenas se existirem (para o PIX não aparecer "••••")
              banco.ultimos_digitos && <div>•••• •••• •••• {banco.ultimos_digitos}</div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-xs opacity-80">Gastos</p>
            <p className="text-lg font-bold">
              R$ {Math.abs(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-8 flex items-center">
            {/* ✅ CORREÇÃO: Adicionado "|| null" para segurança.
                Se a bandeira não for encontrada (ex: 'pix'), não renderiza nada e não dá erro. */}
            {bandeiras[banco.bandeira] || null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartaoPersonalizado;