// src/components/modals/NovaDespesaForm.jsx
// (Este é o NOVO componente de formulário reutilizável)

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

// <<< [REMOVIDO] Imports de Dialog
// import { DialogContent, ... } from "@/components/ui/dialog";

/* ========================= Helpers ========================= */
// (Todas as suas funções helper (getTodayLocalISO, buildParcelas, etc.) 
// permanecem exatamente iguais aqui... omitidas por brevidade)
const getTodayLocalISO = () => { /* ... */ };
const getCurrentMonthISO = () => { /* ... */ };
const toFirstDay = (isoDate) => { /* ... */ };
const toMonthInput = (d) => (d ? String(d).slice(0, 7) : getCurrentMonthISO());
const isStartAfterPurchaseMonth = (mesInicioYYYYMMDD, dataCompraYYYYMMDD) => { /* ... */ };
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
const addMonths = (y, m, inc) => { /* ... */ };
const parseYM = (s) => (s ? s.split('-').slice(0, 2).map(Number) : []);
const buildParcelas = ({ despesaId, total, n, startDateYYYYMM, dataCompraYYYYMMDD }) => { /* ... */ };
const getInitialState = (despesaParaEditar = null) => {
    if (despesaParaEditar) {
      const parcelado = !!despesaParaEditar.is_parcelado || (despesaParaEditar.qtd_parcelas || 1) > 1;
      return {
        amount: despesaParaEditar.amount ?? '',
        description: despesaParaEditar.description ?? '',
        metodo_pagamento: despesaParaEditar.metodo_pagamento ?? 'Itaú', // Padrão
        data_compra: despesaParaEditar.data_compra ?? getTodayLocalISO(),
        isParcelado: parcelado,
        qtd_parcelas: parcelado ? (despesaParaEditar.qtd_parcelas ?? 2) : '',
        startDate: toMonthInput(despesaParaEditar.mes_inicio_cobranca),
        categoria_id: String(despesaParaEditar.categoria_id || ''), 
      };
    }
    return {
      amount: '',
      description: '',
      metodo_pagamento: 'Itaú', // Padrão
      data_compra: getTodayLocalISO(),
      isParcelado: false,
      qtd_parcelas: '',
      startDate: getCurrentMonthISO(),
      categoria_id: '',
    };
  };

/* ====================== Componente ========================= */
// <<< [ALTERADO] As props agora são 'onSaveSuccess' e 'onCancel'
export default function NovaDespesaForm({ despesaParaEditar, onSaveSuccess, onCancel }) {
  const { categorias, fetchData } = useFinance(); 
  
  const [formData, setFormData] = useState(() => getInitialState(despesaParaEditar));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const isEdit = !!despesaParaEditar?.id;

  useEffect(() => {
    setFormData(getInitialState(despesaParaEditar));
  }, [despesaParaEditar]);

  // (Todos os seus 'handleInputChange', 'handleRadioChange', etc. 
  // permanecem exatamente iguais... omitidos por brevidade)
  const handleInputChange = (e) => { /* ... */ };
  const handleRadioChange = (name) => (value) => { /* ... */ };
  const handleSwitchChange = (name) => (checked) => { /* ... */ };
  const handleSelectChange = (name) => (value) => { /* ... */ };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setError('');
    
    if (!formData.categoria_id) {
        setCategoryError('A despesa deve ser categorizada.');
        return;
    }
    setCategoryError('');

    try {
      setIsSaving(true);
      
      // (Toda a sua lógica de 'handleSubmit' (dadosParaSalvar, buildParcelas, etc.)
      // permanece exatamente igual... omitida por brevidade)
      
      // ... lógica de salvar (supabase.from('despesas')... etc) ...
      
      alert(isEdit ? 'Despesa atualizada com sucesso.' : 'Despesa criada com sucesso.');
      
      await fetchData(); 
      
      // <<< [ALTERADO] Chama 'onSaveSuccess' ao invés de 'onClose'
      if (onSaveSuccess) onSaveSuccess(); 
      
    } catch (err) {
      alert(`Erro ao salvar: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };


  // <<< [ALTERADO] Retorna o formulário (sem DialogContent)
  // Envolvemos com um <div className="p-6"> para manter o padding do modal
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-h-[80vh] overflow-y-auto">
      
      {/* <<< [ADICIONADO] Um Título e Descrição para a PÁGINA */}
      <div className="pb-4">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          {isEdit ? 'Editar Despesa' : 'Nova Despesa Variável'}
        </h2>
        <p className="text-muted-foreground">
          {isEdit ? 'Modifique os detalhes desta despesa.' : 'Preencha os dados da nova despesa.'}
        </p>
      </div>

      {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded-lg mb-4">{error}</div>}

      <Card className="shadow-none border-0">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-lg font-semibold">Detalhes da Compra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {/* ... (Todo o conteúdo do seu formulário: Inputs de Valor, Descrição, Categoria) ... */}
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
          {/* ... (Todo o resto do formulário: Método, Datas, Parcelado, etc.) ... */}
        </CardContent>
      </Card>

      {/* <<< [ALTERADO] Footer agora é um <div> */}
      <div className="flex justify-end gap-3 pt-4">
        {/* O botão Cancelar agora chama 'onCancel' */}
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : (<><Check size={18} className="mr-2" />{isEdit ? 'Salvar Alterações' : 'Adicionar Despesa'}</>)}
        </Button>
      </div>
    </form>
  );
}