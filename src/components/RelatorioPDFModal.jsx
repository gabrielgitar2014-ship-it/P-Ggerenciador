import React, { useState, useEffect } from 'react'; // <<< [ALTERAÇÃO] Importa 'useEffect'
import { useModal } from '../context/ModalContext'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer } from 'lucide-react';

// <<< ATENÇÃO: Ajuste este caminho para o local real da sua logo
import logoApp from '../../assets/icon.png'; 
// ---

// Função para formatar moeda
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

// Função para criar um nome de arquivo seguro
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_')           // Substitui espaços por _
    .replace(/[^\w-]+/g, '')     // Remove caracteres não-palavras
    .replace(/--+/g, '_')         // Substitui múltiplos - por _
    .replace(/^-+/, '')           // Remove _ do início
    .replace(/-+$/, '');          // Remove _ do fim
};


const RelatorioPDFModal = (props) => {
  const { hideModal } = useModal(); 

  // 1. Extrai os dados passados para o modal
  const { 
    despesas: despesasOriginais = [], // Renomeado para clareza
    defaultTitle = 'Relatório de Despesas', 
  } = props; 

  // 2. Define o estado para as opções de personalização
  const [titulo, setTitulo] = useState(defaultTitle);
  const [nomeArquivo, setNomeArquivo] = useState(slugify(defaultTitle) + '.pdf');
  const [colunas, setColunas] = useState({
    data: true,
    descricao: true,
    parcela: true,
    categoria: false, 
    valor: true,
  });

  // <<< [NOVO] Estados para os novos filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [apenasParcelados, setApenasParcelados] = useState(false);
  // --- Fim da [NOVO]

  // <<< [NOVO] Efeito para pré-preencher as datas de início e fim
  useEffect(() => {
    if (despesasOriginais && despesasOriginais.length > 0) {
      // Extrai todas as datas válidas
      const datas = despesasOriginais
        .map(d => d.date || d.data_compra)
        .filter(Boolean)
        .map(d => d.split('T')[0]); // Garante o formato YYYY-MM-DD

      if (datas.length > 0) {
        // Ordena as datas para encontrar a mínima e a máxima
        datas.sort();
        setDataInicio(datas[0]);
        setDataFim(datas[datas.length - 1]);
      }
    }
  }, [despesasOriginais]); // Roda apenas quando as despesas mudam
  // --- Fim da [NOVO]
  
  // 3. Handlers de mudança (restante)
  const handleColumnChange = (coluna) => {
    setColunas((prev) => ({
      ...prev,
      [coluna]: !prev[coluna],
    }));
  };
  
  const handleTituloChange = (e) => {
    const novoTitulo = e.target.value;
    setTitulo(novoTitulo);
    setNomeArquivo(slugify(novoTitulo) + '.pdf');
  };

  // 5. Função principal para gerar o PDF
  const handleGerarPDF = () => {
    try {
      
      // <<< [ALTERAÇÃO] Aplicando os filtros antes de gerar o PDF
      // 1. Filtra por "Apenas Parcelados"
      const despesasFiltradasPorParcela = apenasParcelados
        ? despesasOriginais.filter(d => d.is_parcelado === true)
        : despesasOriginais;

      // 2. Filtra por "Período"
      const despesasFiltradas = despesasFiltradasPorParcela.filter(d => {
        const dataItemStr = (d.date || d.data_compra).split('T')[0];
        
        const passaInicio = dataInicio ? dataItemStr >= dataInicio : true;
        const passaFim = dataFim ? dataItemStr <= dataFim : true;
        
        return passaInicio && passaFim;
      });
      
      // 3. Recalcula o total baseado na lista filtrada
      const totalValorFiltrado = despesasFiltradas.reduce((sum, despesa) => sum + (Number(despesa.amount) || 0), 0);
      // --- Fim da [ALTERAÇÃO]

      const doc = new jsPDF();
      
      // --- 1. Cabeçalho com a Marca (Logo + Nome) ---
      doc.addImage(logoApp, 'PNG', 14, 12, 15, 15);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("GenFinance", 32, 22);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 28, 196, 28); 
      
      // --- 2. Título do Relatório (Personalizado) ---
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.text(titulo, 14, 40);

      // --- 3. Definição da Tabela (Baseado nas colunas) ---
      const head = [[]];
      const body = [];
      const colunasAtivas = []; 

      if (colunas.data) { head[0].push('Data'); colunasAtivas.push('data'); }
      if (colunas.descricao) { head[0].push('Descrição'); colunasAtivas.push('descricao'); }
      if (colunas.parcela) { head[0].push('Parcela'); colunasAtivas.push('parcela'); }
      if (colunas.categoria) { head[0].push('Categoria'); colunasAtivas.push('categoria'); }
      if (colunas.valor) { head[0].push('Valor'); colunasAtivas.push('valor'); }

      // <<< [ALTERAÇÃO] Mapeia a lista 'despesasFiltradas' (não 'despesas')
      // --- 4. Corpo da Tabela (Mapeando as despesas filtradas) ---
      despesasFiltradas.forEach(d => {
        const row = [];
        colunasAtivas.forEach(col => {
          switch(col) {
            case 'data':
              const dataOriginal = d.date || d.data_compra;
              row.push(dataOriginal ? new Date(dataOriginal).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A');
              break;
            case 'descricao':
              row.push(d.description || 'Sem descrição');
              break;
            case 'parcela':
              let parcelaInfo = d.parcelaInfo;
              if (!parcelaInfo) {
                  parcelaInfo = d.is_fixed ? 'Fixa' : '1/1';
              }
              row.push(parcelaInfo);
              break;
            case 'categoria':
              row.push(d.category || 'N/A');
              break;
            case 'valor':
              const valorNumerico = Number(d.amount) || 0;
              row.push(formatCurrency(valorNumerico * -1));
              break;
            default:
              break;
          }
        });
        body.push(row);
      });
      // --- Fim da [ALTERAÇÃO]


      // <<< [ALTERAÇÃO] Usa o 'totalValorFiltrado' (não 'totalValor')
      // --- 5. Rodapé da Tabela (Total) ---
      const totalColSpan = colunasAtivas.length - 1;
      const totalFormatado = formatCurrency(Number(totalValorFiltrado) * -1);
      
      const foot = [[
        { 
          content: 'Total', 
          colSpan: totalColSpan, 
          styles: { halign: 'right', fontStyle: 'bold' } 
        },
        { 
          content: totalFormatado, 
          styles: { halign: 'right', fontStyle: 'bold' } 
        }
      ]];
      // --- Fim da [ALTERAÇÃO]

      // --- 6. Geração do PDF com autoTable ---
      autoTable(doc, {
        head: head,
        body: body,
        foot: (colunas.valor && despesasFiltradas.length > 0) ? foot : undefined,
        startY: 48,
        headStyles: { fillColor: [67, 56, 202] }, 
        footStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0] },
        didDrawPage: (data) => {
          doc.setFontSize(10);
          doc.text(`Página ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // --- 7. Download ---
      doc.save(nomeArquivo); 
      hideModal(); 

    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      alert("Desculpe, ocorreu um erro ao gerar o relatório em PDF. Verifique o console para mais detalhes.");
    }
  };

  // 6. JSX do Modal
  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle className="text-xl">Personalizar Relatório PDF</DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 pt-4">
        {/* Opção: Título */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="titulo">Título do Relatório</Label>
          <Input
            type="text"
            id="titulo"
            value={titulo}
            onChange={handleTituloChange}
          />
        </div>
        
        {/* Opção: Nome do Arquivo */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="nomeArquivo">Nome do Arquivo (.pdf)</Label>
          <Input
            type="text"
            id="nomeArquivo"
            value={nomeArquivo}
            onChange={(e) => setNomeArquivo(e.target.value)}
          />
        </div>

        {/* <<< [NOVO] Filtros de Data e Parcelados */}
        <div className="grid w-full items-center gap-4">
          <Label>Filtros</Label>
          
          {/* Filtro de Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                type="date"
                id="dataInicio"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                type="date"
                id="dataFim"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtro de Parcelados */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="apenasParcelados" 
              checked={apenasParcelados} 
              onCheckedChange={(checked) => setApenasParcelados(checked)} 
            />
            <Label htmlFor="apenasParcelados" className="font-normal">
              Mostrar apenas despesas parceladas
            </Label>
          </div>
        </div>
        {/* --- Fim da [NOVO] */}


        {/* Opção: Colunas */}
        <div className="grid w-full items-center gap-1.5">
          <Label>Incluir Colunas</Label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
            
            <div className="flex items-center space-x-2">
              <Checkbox id="col_data" checked={colunas.data} onCheckedChange={() => handleColumnChange('data')} />
              <Label htmlFor="col_data" className="font-normal">Data</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="col_descricao" checked={colunas.descricao} onCheckedChange={() => handleColumnChange('descricao')} />
              <Label htmlFor="col_descricao" className="font-normal">Descrição</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="col_parcela" checked={colunas.parcela} onCheckedChange={() => handleColumnChange('parcela')} />
              <Label htmlFor="col_parcela" className="font-normal">Parcela</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="col_categoria" checked={colunas.categoria} onCheckedChange={() => handleColumnChange('categoria')} />
              <Label htmlFor="col_categoria" className="font-normal">Categoria</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="col_valor" checked={colunas.valor} onCheckedChange={() => handleColumnChange('valor')} />
              <Label htmlFor="col_valor" className="font-normal">Valor</Label>
            </div>

          </div>
        </div>
      </div>

      <DialogFooter className="pt-4">
        <DialogClose asChild>
          <Button variant="ghost">Cancelar</Button>
        </DialogClose>
        <Button onClick={handleGerarPDF} disabled={!colunas.data && !colunas.descricao && !colunas.parcela && !colunas.categoria && !colunas.valor}>
          <Printer className="mr-2 h-4 w-4" />
          Gerar PDF
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RelatorioPDFModal;