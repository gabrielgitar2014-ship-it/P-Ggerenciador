// src/components/modals/NovaDespesaModal.jsx
// (Versão 4.1 - Refatoração Mobile-First e Correção de Build/Imports)
// (Versão 4.2 - Ajuste de layout das Datas para coluna única em mobile)

import React, { useState, useEffect } from 'react'; // Usando React e hooks
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';

// --- Importações UI e Ícones ---
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from "@/components/ui/dialog";
import { CircleDollarSign, PencilLine, Hash, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { CircleDollarSign, PencilLine, Hash, Check } from 'lucide-react';

// --- Helpers e Constantes ---
import { getOrSetDeviceId } from '../../utils/deviceId';

const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose 
} from "@/components/ui/dialog";

/* ========================= Helpers (Mantidos) ========================= */
// --- Helpers e Constantes (Mantidos) ---
const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];
const getTodayLocalISO = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split('T')[0];
};

const getCurrentMonthISO = () => {
  const today = new Date();
  const y = today.getFullYear();
@@ -202,15 +197,15 @@


  return (
    // CORREÇÃO 1: sm:max-w-md para dar mais espaço em telas maiores que mobile
    // Ajustado o max-width para melhor proporção em mobile
    <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[95vh] overflow-hidden p-0"> 
      <DialogHeader className="p-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <DialogTitle className="text-xl font-bold dark:text-white flex items-center gap-2">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa Variável'}
        </DialogTitle>
      </DialogHeader>

      {/* CORREÇÃO 2: Aumenta o padding do form para p-4 e permite o scroll vertical */}
      {/* Seção de Formulário com scroll vertical */}
      <form onSubmit={handleSubmit} className="space-y-4 p-4 max-h-[85vh] overflow-y-auto">
        {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

@@ -271,7 +266,6 @@
          <CardContent className="space-y-4 p-0">
            <div className="grid w-full items-center gap-1.5">
              <Label>Método de pagamento</Label>
              {/* Layout RadioGroup */}
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-2 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2 border rounded-full px-3 py-1 bg-white dark:bg-slate-900">
@@ -282,48 +276,48 @@
              </RadioGroup>
            </div>

            {/* Datas - Força duas colunas */}
            <div className="grid grid-cols-2 gap-4">
            {/* CORREÇÃO APLICADA AQUI: Remover grid-cols-2 e gap-4 para empilhar em colunas */}
            <div className="space-y-4"> 
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="mes_inicio_cobranca">Início da Cobrança</Label>
                <Input id="mes_inicio_cobranca" name="mes_inicio_cobranca" type="month" value={formData.mes_inicio_cobranca} onChange={handleInputChange} required />
              </div>
            </div>

            {/* Compra Parcelada */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
                <p className="text-sm text-muted-foreground">Ative se a compra tiver mais de uma parcela.</p>
              </div>
              <Switch id="isParcelado" checked={formData.isParcelado} onCheckedChange={handleSwitchChange('isParcelado')} />
            </div>

            {formData.isParcelado && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- FOOTER / BOTÕES --- */}
        <DialogFooter className="flex justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className="text-sm">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSaving} className="text-sm">
            {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
