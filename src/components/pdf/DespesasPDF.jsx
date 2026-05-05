import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 35, 
    fontFamily: 'Helvetica', 
    fontSize: 9, 
    color: '#333', 
    backgroundColor: '#f9f9f9' 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 25, 
    borderBottomWidth: 2, 
    borderBottomColor: '#6c5ce7', 
    borderBottomStyle: 'solid', 
    paddingBottom: 10 
  },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#333' },
  subtitle: { fontSize: 11, color: '#666', marginTop: 4 },
  summarySection: { marginBottom: 25 },
  summaryTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10, color: '#6c5ce7' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryBox: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 5, 
    borderWidth: 1, 
    borderColor: '#eee', 
    alignItems: 'center', 
    marginRight: 6
  },
  summaryBoxLabel: { fontSize: 9, color: '#555', marginBottom: 5, fontFamily: 'Helvetica-Bold' },
  summaryBoxValue: { fontSize: 13, color: '#333', fontFamily: 'Helvetica-Bold' },
  tableSection: { 
    padding: 10, 
    backgroundColor: '#fff', 
    borderRadius: 5, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0', 
    borderBottomStyle: 'solid' 
  },
  tableHeader: { backgroundColor: '#f4f5f7', fontFamily: 'Helvetica-Bold' },
  tableCol: { padding: 8, justifyContent: 'center' },
  colDesc: { width: '40%' },
  colDate: { width: '20%' },
  colMethod: { width: '20%' },
  colValue: { width: '20%', textAlign: 'right' },
  footer: { 
    position: 'absolute', 
    bottom: 20, 
    left: 35, 
    right: 35, 
    textAlign: 'center', 
    color: '#aaa', 
    fontSize: 8 
  },
});

const formatarData = (dataString) => {
  if (!dataString || typeof dataString !== 'string') return 'N/A';
  const parts = dataString.split('-');
  if (parts.length !== 3) return dataString;
  const [ano, mes, dia] = parts;
  return `${dia}/${mes}/${ano}`;
};

const formatarValor = (valor) => {
  const num = Number(valor);
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
};

const DespesasPDF = ({ data }) => {
  const { 
    startDate, 
    endDate, 
    totalDespesas, 
    compras,
    totalDespesasParceladas,
  } = data || { compras: [] };

  // Linha para depuração:
  console.log('Dados das Compras:', compras);

  if (!data) {
    return (
      <Document>
        <Page><Text>Dados inválidos.</Text></Page>
      </Document>
    );
  }

  const totalItens = compras?.length || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Compras</Text>
          <Text style={styles.subtitle}>
            Período de {formatarData(startDate)} a {formatarData(endDate)}
          </Text>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Resumo do Período</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>TOTAL COMPRADO</Text>
              <Text style={styles.summaryBoxValue}>{formatarValor(totalDespesas)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryBoxLabel}>TOTAL EM PARCELAMENTOS</Text>
              <Text style={styles.summaryBoxValue}>{formatarValor(totalDespesasParceladas)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableSection}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, styles.colDesc]}>Descrição</Text>
            <Text style={[styles.tableCol, styles.colDate]}>Data da Compra</Text>
            <Text style={[styles.tableCol, styles.colMethod]}>Pagamento</Text>
            <Text style={[styles.tableCol, styles.colValue]}>Valor Total</Text>
          </View>
          
          {(compras || []).map((compra, index) => {
            const eParcelado = compra.qtd_parcelas > 1;
            const valorParcela = eParcelado ? compra.amount / compra.qtd_parcelas : 0;

            return (
              <View 
                style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#fff' : '#fcfcfc' }]} 
                key={compra.id || index}
              >
                <Text style={[styles.tableCol, styles.colDesc]}>{compra.description || 'Sem descrição'}</Text>
                <Text style={[styles.tableCol, styles.colDate]}>{formatarData(compra.data_compra)}</Text>
                <Text style={[styles.tableCol, styles.colMethod]}>{compra.metodo_pagamento || 'N/A'}</Text>
                
                <View style={[styles.tableCol, styles.colValue, { alignItems: 'flex-end' }]}>
                  <Text>{formatarValor(compra.amount)}</Text>
                  {eParcelado && (
                    <Text style={{ fontSize: 7, color: '#666' }}>
                      ({compra.qtd_parcelas}x de {formatarValor(valorParcela)})
                    </Text>
                  )}
                </View>

              </View>
            );
          })}

          {totalItens === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, {width: '100%', textAlign: 'center'}]}>
                Nenhuma compra encontrada para o período.
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.footer} fixed>
          Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </Text>
      </Page>
    </Document>
  );
};

export default DespesasPDF;