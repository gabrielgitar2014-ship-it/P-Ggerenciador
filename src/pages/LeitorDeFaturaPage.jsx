import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Toaster, toast } from 'sonner'; 
import { 
  Upload, Loader2, Check, Trash2, MousePointer2, Layers, 
  ChevronDown, ChevronUp, Receipt, ScanLine, BrainCircuit, 
  Calendar, Wallet, Tag, CheckSquare, Square, ShieldCheck, Zap, FileText, ArrowLeft
} from 'lucide-react';


import { generateInstallments } from '../utils/invoiceCalculator';

// Importa o Contexto Financeiro para salvar e buscar dados
import { useFinance } from '../context/FinanceContext';

// CONFIGURAÇÃO API PYTHON
const PYTHON_API_URL = 'https://finansmart-backend-119305932517.us-central1.run.app'; 

// --- COMPONENTE VISUAL: BLOBS DE FUNDO ---
const BackgroundBlobs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-pulse" />
    <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[100px] mix-blend-multiply opacity-70" />
  </div>
);

// --- COMPONENTE VISUAL: LOADER ---
const SmartLoader = () => (
  <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center">
    <div className="relative w-24 h-24 mb-6">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
      <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      <BrainCircuit className="absolute inset-0 m-auto text-indigo-600 w-8 h-8 animate-pulse" />
    </div>
    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Processando Fatura</h2>
    <p className="text-slate-500 text-sm mt-2">Nossa IA está lendo o documento...</p>
  </div>
);

export default function LeitorDeFaturaPage({ onClose }) {
  const navigate = useNavigate();
  
  // 1. INTEGRAÇÃO COM FINANCE CONTEXT (Como no NovaDespesaModal)
  
  const { 
    bancos: accountsList, 
    categorias: categoriesList, 
    saveInvoiceExpenses, // [cite: 157] Função específica do contexto
    loading: loadingData 
  } = useFinance();

  // STATES DE UI
  const [loading, setLoading] = useState(false); 
  const [processingSelection, setProcessingSelection] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visualData, setVisualData] = useState(null); 
  const [isDragging, setIsDragging] = useState(false);
  const [interactionMode, setInteractionMode] = useState('scroll');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);
  
  // STATES DE DADOS DA FATURA
  const [confirmedTransactions, setConfirmedTransactions] = useState([]);
  const [selectedTxIds, setSelectedTxIds] = useState(new Set()); 
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedAccount, setSelectedAccount] = useState('');

  // STATES DE SELEÇÃO MANUAL (CANVAS)
  const [selectionBox, setSelectionBox] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [pageScales, setPageScales] = useState({});
  const imageRefs = useRef({});
  const containerRef = useRef(null);

  // --- HANDLER: VOLTAR ---
  const handleBack = () => {
    if (visualData) {
      if (window.confirm("Deseja voltar para o início? Os dados não salvos serão perdidos.")) {
        setVisualData(null);
        setConfirmedTransactions([]);
        setInvoiceDate(new Date().toISOString().slice(0, 7));
        setSelectedAccount('');
      }
    } else {
      if (onClose) onClose();
      else navigate(-1);
    }
  };

  // --- HANDLER: EDITAR TRANSAÇÃO (EM LINHA) ---
  const handleUpdateTransaction = (id, field, value) => {
    setConfirmedTransactions(prev => prev.map(tx => 
      tx.id === id ? { ...tx, [field]: value } : tx
    ));
  };

  // --- HANDLER: UPLOAD DE ARQUIVO ---
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
    if (!selectedFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      
      const response = await fetch(`${PYTHON_API_URL}/process_visual`, { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      setVisualData(data.visual_data);
      
      
      if (data.visual_data.auto_transactions && data.visual_data.auto_transactions.length > 0) {
        setConfirmedTransactions(data.visual_data.auto_transactions.map(tx => ({
            ...tx, 
            id: tx.id || Math.random().toString(36).substr(2, 9), 
            category_id: ''
        })));
      }
      setIsBottomSheetOpen(true); 
    } catch (err) {
      toast.error("Erro de conexão com a IA: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e); };

  // --- HANDLER: PROCESSAR SELEÇÃO MANUAL ---
  const processManualSelection = async (boxRect, pageNum) => {
    if (!visualData || !boxRect) return;
    setProcessingSelection(true);

    const pageMeta = visualData.text_map.find(p => p.page === pageNum);
    const currentScale = pageScales[pageNum] || 1;
    const imgRef = imageRefs.current[pageNum];
    
    if (!imgRef) { setProcessingSelection(false); return; }

    const imgRect = imgRef.getBoundingClientRect();
    
    const relativeBox = {
      x0: (boxRect.x - imgRect.left) / currentScale,
      top: (boxRect.y - imgRect.top) / currentScale,
      x1: (boxRect.x + boxRect.width - imgRect.left) / currentScale,
      bottom: (boxRect.y + boxRect.height - imgRect.top) / currentScale
    };

    const selectedWords = pageMeta.words.filter(word => {
      const wCx = word.x0 + (word.x1 - word.x0) / 2;
      const wCy = word.top + (word.bottom - word.top) / 2;
      return (wCx >= relativeBox.x0 && wCx <= relativeBox.x1 && wCy >= relativeBox.top && wCy <= relativeBox.bottom);
    });

    if (selectedWords.length > 0) {
      try {
        const response = await fetch(`${PYTHON_API_URL}/parse_selection`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ words: selectedWords })
        });
        const data = await response.json();
        
        if (data.transactions?.length > 0) {
            const newTxs = data.transactions.map(t => ({ 
              ...t, 
              id: t.id || Math.random().toString(36).substr(2, 9),
              box: { ...relativeBox, page: pageNum }, 
              category_id: ''
            }));
            
            setConfirmedTransactions(prev => [...prev, ...newTxs]);
            setInteractionMode('scroll'); 
           
            
            // Auto-scroll para gaveta
            setIsBottomSheetOpen(true);
        } else {
            toast.info("Nenhuma transação identificada nesta área.");
        }
      } catch (err) { console.error(err); }
    }
    setProcessingSelection(false);
  };

  const handlePointerDown = (e, pageNum) => {
    if (interactionMode === 'scroll') return;
    if (e.cancelable) e.preventDefault(); 
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDrawing(true);
    startPos.current = { x: clientX, y: clientY };
    setSelectionBox({ x: clientX, y: clientY, width: 0, height: 0, page: pageNum });
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const width = clientX - startPos.current.x;
    const height = clientY - startPos.current.y;
    setSelectionBox(prev => ({ 
        ...prev, 
        width: Math.abs(width), 
        height: Math.abs(height), 
        x: width > 0 ? startPos.current.x : clientX, 
        y: height > 0 ? startPos.current.y : clientY 
    }));
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (selectionBox && selectionBox.width > 10 && selectionBox.height > 10) {
        processManualSelection(selectionBox, selectionBox.page);
    }
    setSelectionBox(null);
  };

  const updateScales = () => {
    if (!visualData) return;
    const newScales = {};
    visualData.images.forEach((img) => {
      const el = imageRefs.current[img.page];
      const meta = visualData.text_map.find(p => p.page === img.page);
      if (el && meta) newScales[img.page] = el.offsetWidth / meta.width;
    });
    setPageScales(newScales);
  };
  useEffect(() => { window.addEventListener('resize', updateScales); return () => window.removeEventListener('resize', updateScales); }, [visualData]);

  const toggleSelection = (id) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedTxIds(newSet);
  };
  
  const toggleSelectAll = () => {
    if (selectedTxIds.size === confirmedTransactions.length) setSelectedTxIds(new Set());
    else setSelectedTxIds(new Set(confirmedTransactions.map(t => t.id)));
  };
  
  const updateMassCategory = (categoryId) => {
    if (!categoryId) return;
    setConfirmedTransactions(prev => prev.map(tx => selectedTxIds.has(tx.id) ? { ...tx, category_id: categoryId } : tx));
    setSelectedTxIds(new Set()); 
    toast.success("Categoria aplicada em massa!");
  };

  const updateCategory = (id, categoryId) => {
    handleUpdateTransaction(id, 'category_id', categoryId);
  };

  const handleDeleteTransaction = (id) => {
    setConfirmedTransactions(prev => prev.filter(t => t.id !== id));
  };

  // --- HANDLER: SALVAR FINAL (INTEGRAÇÃO COM CONTEXT) ---
  const handleFinalSave = async () => {
    // 1. Validações Básicas
    if (!selectedAccount) return toast.warning("Por favor, selecione a Conta/Cartão.");
    if (!invoiceDate) return toast.warning("Por favor, selecione o Mês de Referência.");
    
    
    const txToProcess = selectedTxIds.size > 0 
        ? confirmedTransactions.filter(tx => selectedTxIds.has(tx.id))
        : confirmedTransactions;

    if (txToProcess.length === 0) return toast.warning("Nenhuma transação para importar.");

    setSaving(true);
    try {
      // 2. Prepara os dados (Normalização Pai-Filho)
     
      const expandedData = generateInstallments(txToProcess, invoiceDate, selectedAccount);
      
      console.log("Payload Gerado:", expandedData);

      // 3. Envia para o Contexto (Supabase)
      
      const result = await saveInvoiceExpenses(expandedData);

      if (result.ok) {
        toast.success(`Sucesso! ${result.data.length} despesas importadas.`);
        // Volta para a home ou fecha o modal
        if (onClose) onClose();
        else navigate('/');
      } else {
        throw new Error(result.error?.message || "Erro desconhecido ao salvar.");
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalValue = confirmedTransactions.reduce((acc, cur) => { 
    const vStr = cur.value ? cur.value.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim() : "0";
    const v = parseFloat(vStr); 
    return acc + (isNaN(v) ? 0 : v); 
  }, 0);

  // --- RENDERIZAÇÃO ---
  
  if (loading || loadingData) return <SmartLoader />;

  // MODO 1: UPLOAD
  if (!visualData) {
   return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden font-sans">
      <Toaster position="top-center" richColors />
      <BackgroundBlobs />
      <div className="absolute top-4 left-4 z-50">
        <button onClick={handleBack} className="flex items-center gap-2 p-2 px-4 bg-white/80 backdrop-blur rounded-full shadow-sm text-slate-600 hover:text-slate-900 border border-slate-200 transition-all hover:shadow-md">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Voltar</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl text-center space-y-10"
          >
             <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <BrainCircuit className="w-3 h-3" /> IA 2.0 Ativada
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
                   Transforme Faturas em <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      Inteligência Financeira
                   </span>
                </h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto">
                   Nossa IA analisa seu PDF ou Imagem, categoriza gastos e organiza parcelas automaticamente.
                </p>
             </div>

             <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className="group relative">
                <label className={`
                   block w-full aspect-[3/1] bg-white/60 backdrop-blur-md rounded-[2rem] border-2 border-dashed 
                   flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300
                   ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-105' : 'border-slate-300 hover:border-blue-400 hover:bg-white/80 shadow-xl shadow-slate-200/50'}
                `}>
                   <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                   </div>
                   <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">Clique ou arraste sua fatura</p>
                      <p className="text-sm text-slate-400 mt-1">Suporta PDF, JPG e PNG</p>
                   </div>
                   <input type="file" accept="application/pdf, image/*" onChange={handleFileSelect} className="hidden" />
                </label>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                   { icon: ShieldCheck, title: "Dados Criptografados", desc: "Sua privacidade em 1º lugar", color: "text-emerald-500" },
                   { icon: Zap, title: "Processamento Real", desc: "Análise em segundos", color: "text-amber-500" },
                   { icon: FileText, title: "Detecção Automática", desc: "Data e parcelas inteligentes", color: "text-blue-500" }
                ].map((item, idx) => (
                   <div key={idx} className="bg-white/50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                      <div>
                         <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
                         <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                   </div>
                ))}
             </div>
          </motion.div>
      </div>
    </div>
   );
  }

  // MODO 2: EDIÇÃO E CONFIRMAÇÃO
  return (
    <div className="min-h-screen bg-slate-100 relative flex flex-col font-sans overflow-hidden">
      <Toaster position="top-center" richColors />
      <div className="absolute top-4 left-4 z-50">
        <button onClick={handleBack} className="p-2 bg-white rounded-full shadow-md text-slate-600 hover:text-slate-900 transition-transform hover:scale-105">
            <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed top-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-slate-700/50 flex items-center gap-1 pointer-events-auto">
          <button onClick={() => setInteractionMode('scroll')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${interactionMode === 'scroll' ? 'bg-white text-slate-900 shadow-md transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
            <MousePointer2 className="w-4 h-4" /> Navegar
          </button>
          <button onClick={() => setInteractionMode('draw')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${interactionMode === 'draw' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 transform scale-105' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
            <Layers className="w-4 h-4" /> Selecionar
          </button>
        </div>
      </motion.div>

      <div ref={containerRef} className={`flex-1 overflow-y-auto pb-[400px] pt-24 px-4 ${interactionMode === 'draw' ? 'cursor-crosshair touch-none select-none' : 'cursor-grab touch-pan-y'}`} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onMouseLeave={handlePointerUp}>
         <div className="max-w-4xl mx-auto relative space-y-4">
            {processingSelection && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-black/80 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                    <span className="font-bold text-sm">Lendo seleção...</span>
                </div>
            )}
            {visualData.images.map((imgPage) => {
                const pageNum = imgPage.page;
                return (
                  <div key={pageNum} className="relative shadow-2xl rounded-lg overflow-hidden ring-1 ring-slate-900/5 bg-white" onPointerDown={(e) => handlePointerDown(e, pageNum)}>
                    <img ref={el => imageRefs.current[pageNum] = el} src={imgPage.base64} className="w-full h-auto block pointer-events-none" onLoad={updateScales} alt={`Página ${pageNum}`} />
                    {confirmedTransactions.filter(tx => tx.box && tx.box.page === pageNum).map(tx => {
                        const currentScale = pageScales[pageNum] || 1;
                        return (
                            <motion.div key={tx.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute bg-emerald-500/30 border border-emerald-500 z-20 rounded-sm cursor-pointer group hover:bg-red-500/30 hover:border-red-500 transition-colors"
                                style={{ left: tx.box.x0 * currentScale, top: tx.box.top * currentScale, width: (tx.box.x1 - tx.box.x0) * currentScale, height: (tx.box.bottom - tx.box.top) * currentScale }}
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Remover esta seleção?')) handleDeleteTransaction(tx.id); }}
                            >
                               <div className="hidden group-hover:flex absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">Remover</div>
                            </motion.div>
                        );
                    })}
                    {selectionBox && selectionBox.page === pageNum && (
                        <div className="absolute border-2 border-indigo-500 bg-indigo-500/20 z-30 pointer-events-none rounded shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                            style={{ left: selectionBox.x - imageRefs.current[pageNum]?.getBoundingClientRect().left, top: selectionBox.y - imageRefs.current[pageNum]?.getBoundingClientRect().top, width: selectionBox.width, height: selectionBox.height }} 
                        />
                    )}
                  </div>
                );
            })}
         </div>
      </div>

      <motion.div initial={{ y: 200 }} animate={{ y: isBottomSheetOpen ? 0 : '85%' }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} className="fixed bottom-0 left-0 right-0 bg-white z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] h-[85vh] flex flex-col border-t border-slate-100">
        <div onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)} className="h-16 flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-[2rem] border-b border-slate-100 shrink-0">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Detectado</span>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={12} /> {confirmedTransactions.length}</span>
                </div>
            </div>
            <div className="p-2 bg-slate-100 rounded-full text-slate-400">{isBottomSheetOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}</div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-6 pb-32">
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Calendar size={12} className="text-indigo-500"/> Mês Ref.</label>
                    <input type="month" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full text-sm font-bold bg-transparent outline-none"/>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><Wallet size={12} className="text-indigo-500"/> Cartão/Conta</label>
                    <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full text-sm font-bold bg-transparent outline-none">
                        <option value="">Selecione...</option>
                        {accountsList.map(acc => <option key={acc.id} value={acc.id}>{acc.nome}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600">
                    {selectedTxIds.size === confirmedTransactions.length && confirmedTransactions.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                    Selecionar Todos
                </button>
                {selectedTxIds.size > 0 && (
                    <select onChange={(e) => updateMassCategory(e.target.value)} className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg outline-none cursor-pointer">
                        <option value="">Categorizar ({selectedTxIds.size})...</option>
                        {categoriesList.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                )}
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                {confirmedTransactions.map((tx) => {
                    const isSelected = selectedTxIds.has(tx.id);
                    return (
                        <motion.div key={tx.id || Math.random()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} className={`bg-white p-4 rounded-2xl border shadow-sm transition-all ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-100'}`}>
                            <div className="flex gap-3">
                                <button onClick={() => toggleSelection(tx.id)} className={`mt-1 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>{isSelected ? <CheckSquare size={20} /> : <Square size={20} />}</button>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex gap-2 items-center">
                                            <input type="text" value={tx.date || ''} placeholder="DD/MM" onChange={(e) => handleUpdateTransaction(tx.id, 'date', e.target.value)} className="w-12 text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded text-center outline-none border border-transparent focus:border-indigo-400 focus:bg-white transition-all"/>
                                            <input type="text" value={tx.installment || ''} placeholder="1x" onChange={(e) => handleUpdateTransaction(tx.id, 'installment', e.target.value)} className={`w-10 text-[10px] font-bold text-center px-1 py-0.5 rounded border border-transparent outline-none focus:border-amber-400 focus:bg-white transition-all ${tx.installment ? 'text-amber-600 bg-amber-50 border-amber-100' : 'bg-slate-50 text-slate-400'}`} />
                                        </div>
                                        <input type="text" value={tx.value || ''} onChange={(e) => handleUpdateTransaction(tx.id, 'value', e.target.value)} className="w-24 text-sm font-bold text-slate-900 text-right bg-transparent outline-none border-b border-transparent focus:border-indigo-500"/>
                                    </div>
                                    <input type="text" value={tx.description || ''} onChange={(e) => handleUpdateTransaction(tx.id, 'description', e.target.value)} className="w-full text-sm font-medium text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-500 mb-2 truncate focus:text-clip"/>
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                        <Tag size={12} className="text-slate-400" />
                                        <select value={tx.category_id || ''} onChange={(e) => updateCategory(tx.id, e.target.value)} className="flex-1 text-xs text-slate-500 bg-transparent outline-none cursor-pointer hover:text-indigo-600">
                                            <option value="">Sem Categoria</option>
                                            {categoriesList.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                        <button onClick={() => handleDeleteTransaction(tx.id)} className="text-slate-300 hover:text-red-500 ml-2"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 rounded-t-2xl">
             <button onClick={handleFinalSave} disabled={saving || confirmedTransactions.length === 0} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
               {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
               {saving ? 'SALVANDO...' : 'CONFIRMAR IMPORTAÇÃO'}
             </button>
        </div>
      </motion.div>
    </div>
  );

}
