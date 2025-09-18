import React from 'react';
import { Wifi, Radio } from 'lucide-react';
import { FaCcMastercard, FaCcVisa } from 'react-icons/fa';
import { useVisibility } from '../context/VisibilityContext'; // 1. IMPORTADO O CONTEXTO

const CartaoPersonalizado = ({ banco, saldo, isSelected, onClick }) => {
  const { valuesVisible } = useVisibility(); // 2. USANDO O ESTADO DE VISIBILIDADE

  const bandeiras = {
    mastercard: <FaCcMastercard size={32} />,
    visa: <FaCcVisa size={32} />,
  };

  // Função para formatar o valor, mantendo sua lógica original
  const formatCurrency = (value) => {
    if (typeof value !== 'number') value = 0;
    return `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
        {banco.bandeira !== 'pix' && <Wifi className="h-6 w-6" />}
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-1">
          {banco.bandeira !== 'pix' && <Radio className="h-8 w-8 text-yellow-300/80 mt-1" />}
          
          <div className="text-md font-mono tracking-widest leading-tight">
            {Array.isArray(banco.ultimos_digitos) ? (
              banco.ultimos_digitos.map(digitos => (
                <div key={digitos}>•••• •••• •••• {digitos}</div>
              ))
            ) : (
              banco.ultimos_digitos && <div>•••• •••• •••• {banco.ultimos_digitos}</div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-xs opacity-80">Gastos</p>
            <p className="text-lg font-bold">
              {/* 3. LÓGICA DE VISIBILIDADE APLICADA AQUI */}
              {valuesVisible ? formatCurrency(saldo) : 'R$ ••••'}
            </p>
          </div>
          <div className="h-8 flex items-center">
            {bandeiras[banco.bandeira] || null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartaoPersonalizado;
