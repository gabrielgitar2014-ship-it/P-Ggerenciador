// src/components/modals/NovaDespesaModal.jsx
// (Versão 3.3 - Lógica de 'handleSubmit' restaurada e corrigida)

import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useFinance } from '../../context/FinanceContext';
import { CircleDollarSign, PencilLine, Hash, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { getOrSetDeviceId } from '../../utils/deviceId';

import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

const METODOS_DE_PAGAMENTO = ['Itaú', 'Bradesco', 'Nubank', 'PIX'];

/* ========================= Helpers ========================= */
const getTodayLocalISO = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split('T')[0];
};

const getCurrentMonthISO = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const toFirstDay = (isoDate) => {
  const [year, month] = isoDate.split('-');
  return `${year}-${month}-01`;
};

const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());

const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => {
  if (!mesInicioYYYYMMDD || !dataCompraYYYYMMDD) return false;
  const a = new Date(`${String(mesInicioYYYYMMDD).slice(0,7)}-01T00:00:00`);
  const b = new Date(`${String(dataCompraYYYYMMDD).slice(0,7)}-01T00:00:00`);
  return a > b;
};

const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

// Helper de Data (movido para cá para uso no buildParcelas)
const addMonths = (y, m, inc) => {
  const idx = y * 12 + (m - 1) + inc;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return { y: ny, m: nm };
};

// Helper 'parseYM'
const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);

// <<< [CORREÇÃO] Helper buildParcelas corrigido para usar a data de compra
// (Esta lógica estava no seu 'handleSubmit' original, mas movida para o Contexto)
// (Agora está sendo usada manualmente aqui)
const buildParcelas = ({ despesaId, total, n, startDateYYYYMM, dataCompraYYYYMMDD }) => {
  const parcelas = [];
  const valorParcela = round2(total / n);
  const partial = round2(valorParcela * (n - 1));
  const last = round2(total - partial);

  const diaCompra = new Date(dataCompraYYYYMMDD.replace(/-/g, '/')).getDate();
  const [startY, startM] = parseYM(startDateYYYYMM);

  for (let i = 0; i < n; i++) {
    const { y, m } = addMonths(startY, startM, i);
    const dataParcelaStr = `${y}-${String(m).padStart(2, '0')}-${String(diaCompra).padStart(2, '0')}`;
    
    parcelas.push({
      despesa_id: despesaId,
      numero_parcela: i + 1,
      amount: i === (n - 1) ? last : valorParcela, // Garante que o último valor esteja correto
      data_parcela: dataParcelaStr,
      paga: false,
    });
  }
  return parcelas;
};


const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? METODOS_DE_PAGAMENTO[0],
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        // [CORREÇÃO] Renomeado de 'mes_inicio_cobranca' para 'startDate'
        startDate: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
        categoria_id: String(despesaParaEditar.categoria_id || ''), 
      };
    }
    return {
      amount: '',
      description: '',
      metodo_pagamento: METODOS_DE_PAGAMENTO[0],
      data_compra: getTodayLocalISO(),
      isParcelado: false,
      qtd_parcelas: '',
      // [CORREÇÃO] Renomeado de 'mes_inicio_cobranca' para 'startDate'
      startDate: getCurrentMonthISO(),
      categoria_id: '',
    };
  };

/* ====================== Componente ========================= */
export default function NovaDespesaModal({ onClose, despesaParaEditar }) {
  // <<< [CORREÇÃO] Precisamos de 'categorias' E 'fetchData'
  const { categorias, fetchData } = useFinance(); 
  
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const isEdit = !!despesaParaEditar?.id;

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (name) => (value) => {
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSwitchChange = (name) => (checked) => {
    setFormData(p => ({ ...p, isParcelado: checked, qtd_parcelas: checked ? (p.qtd_parcelas > 1 ? p.qtd_parcelas : 2) : 1 }));
  };
  
  const handleSelectChange = (name) => (value) => {
      setFormData(p => ({ ...p, [name]: String(value) }));
      if (name === 'categoria_id' && value) {
          setCategoryError('');
      }
  };

  // <<< [INÍCIO DA CORREÇÃO GERAL DO HANDLESUBMIT] ---
  // A lógica manual foi restaurada e corrigida
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    
    // 1. VALIDAÇÃO DE CATEGORIA
    if (!formData.categoria_id) {
        setCategoryError('A despesa deve ser categorizada.');
        return;
    }
    setCategoryError('');

    try {
      setIsSaving(true);
      
      // 2. Prepara os dados
      const is_parcelado = !!formData.isParcelado;
      const qtd_parcelas = is_parcelado ? Math.max(2, parseInt(formData.qtd_parcelas || '2', 10)) : 1;
      const amountNumber = round2(parseFloat(String(formData.amount).replace(',', '.')) || 0);

      if (!amountNumber || amountNumber <= 0) throw new Error('Informe um valor (amount) válido.');
      if (is_parcelado && (!qtd_parcelas || qtd_parcelas < 2)) throw new Error('Informe a quantidade de parcelas (>= 2).');
      
      const deviceId = getOrSetDeviceId();

      const dadosParaSalvar = {
        amount: amountNumber,
        description: formData.description?.trim(),
        metodo_pagamento: formData.metodo_pagamento,
        data_compra: formData.data_compra, 
        is_parcelado, 
        qtd_parcelas,
        mes_inicio_cobranca: toFirstDay(formData.startDate),
        inicia_proximo_mes: isStartAfterPurchaseMonth(toFirstDay(formData.startDate), formData.data_compra),
        device_id: deviceId,
        categoria_id: Number(formData.categoria_id), // Converte para Número
      };

      let savedData;
      
      // 3. Salva a Despesa (Edição ou Nova)
      if (isEdit) {
        const { data, error } = await supabase.from('despesas').update(dadosParaSalvar).eq('id', despesaParaEditar.id).select().single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase.from('despesas').insert(dadosParaSalvar).select().single();
        if (error) throw error;
        savedData = data;
      }

      // 4. Salva as Parcelas
      const parcelas = buildParcelas({ 
        despesaId: savedData.id, 
        total: amountNumber, 
        n: qtd_parcelas, 
        startDateYYYYMM: formData.startDate, // Passa AAAA-MM
        dataCompraYYYYMMDD: formData.data_compra // Passa AAAA-MM-DD
      });
      
      if (isEdit) {
        await supabase.from('parcelas').delete().eq('despesa_id', savedData.id);
      }
      const { error: insErr } = await supabase.from('parcelas').insert(parcelas);
      if (insErr) throw insErr;
      
      // 5. [CORREÇÃO DO BUG] Adiciona na fila de embedding (apenas para novas despesas)
      if (!isEdit) {
          const categoriaTexto = categorias.find(c => c.id === savedData.categoria_id)?.nome || 'Outros';
          const queueRow = {
            source_id: savedData.id, // O VÍNCULO
            source_table: 'despesas',
            date: savedData.data_compra,
            description: savedData.description,
            category: categoriaTexto,
            amount: savedData.amount
          };
          
          console.log("[NovaDespesaModal] Adicionando na 'embedding_queue':", queueRow);
          
          const { error: queueError } = await supabase
            .from('embedding_queue')
            .insert(queueRow);
            
          if (queueError) {
             console.warn("[NovaDespesaModal] Falha ao adicionar na fila de embedding:", queueError.message);
          }
      }
      
      alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');
      
      // 6. [CORREÇÃO DO BUG] Chama o fetchData para atualizar a UI
      await fetchData(); 
      onClose(); // Fecha o modal
      
    } catch (err) {
      alert(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };
  // --- [FIM DA CORREÇÃO] ---


  return (
    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-hidden p-0">
      <DialogHeader className="p-6 pb-4">
        <DialogTitle className="text-2xl font-bold dark:text-white flex items-center gap-2">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa Variável'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 max-h-[80vh] overflow-y-auto">
        {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-semibold">Detalhes da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="amount" className="flex items-center gap-1">
                <CircleDollarSign size={16} /> Valor
              </Label>
              <Input id="amount" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleInputChange} placeholder="0,00" required />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description" className="flex items-center gap-1">
                <PencilLine size={16} /> Descrição
              </Label>
              <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Ex: Compras no mercado" required />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="categoria_id" className="flex items-center gap-1">
                    <Hash size={16} /> Categoria <span className="text-red-500">*</span>
                </Label>
                <Select 
                    value={formData.categoria_id} 
                    onValueChange={(value) => handleSelectChange('categoria_id')(value)} 
                >
                    <SelectTrigger id="categoria_id" className={categoryError ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecione a Categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto"> 
                        {(categorias || []).map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.nome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {categoryError && <p className="text-sm text-red-500">{categoryError}</p>}
            </div>

          </CardContent>
        </Card>

        <Card className="shadow-none border-0">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-lg font-semibold">Pagamento e Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="grid w-full items-center gap-1.5">
              <Label>Método de pagamento</Label>
              <RadioGroup name="metodo_pagamento" value={formData.metodo_pagamento} onValueChange={handleRadioChange('metodo_pagamento')} className="flex flex-wrap gap-3 pt-2">
                {METODOS_DE_PAGAMENTO.map(method => (
                  <div key={method} className="flex items-center space-x-2 border rounded-full px-3 py-1 bg-white dark:bg-slate-900">
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method} className="text-sm font-normal cursor-pointer">{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="data_compra">Data da compra</Label>
                <Input id="data_compra" name="data_compra" type="date" value={formData.data_compra} onChange={handleInputChange} required />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="startDate">Início da Cobrança</Label> 
                <Input id="startDate" name="startDate" type="month" value={formData.startDate} onChange={handleInputChange} required /> 
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isParcelado" className="text-base">Compra Parcelada?</Label>
                <p className="text-sm text-muted-foreground">Ative se a compra tiver mais de uma parcela.</p>
              </div>
              <Switch id="isParcelado" checked={formData.isParcelado} onCheckedChange={handleSwitchChange('isParcelado')} />
            </div>

            {formData.isParcelado && (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="qtd_parcelas">Quantidade de Parcelas</Label>
                <Input id="qtd_parcelas" name="qtd_parcelas" type="number" min={2} value={formData.qtd_parcelas} onChange={handleInputChange} placeholder="Ex: 12" required={formData.isParcelado} />
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="flex justify-end gap-3 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
