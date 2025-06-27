import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// --- DEFINIÇÃO DE TIPOS ---
// Reutilizamos os mesmos tipos de dados
type ReportData = {
  summaryCards: {
    totalProducts: number;
    stockValue: number;
    totalMovements: number;
    lowStockProducts: number;
  };
  productsByCategory: { name: string; value: number }[];
  valueByCategory: { name: string; value: number }[];
  movementsLast7Days: { date: string; count: number }[];
};

// --- REGISTRO DE FONTES ---
// O react-pdf não usa as fontes do navegador, precisamos registrar as nossas.
// Usaremos as fontes padrão, mas este é o local para adicionar fontes customizadas.
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3iWkU9P4a77A4B-A.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3hWkU9P4a77A4B-C4.ttf', fontWeight: 'bold' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3gWkU9P4a77A4B_A.ttf', fontStyle: 'italic' }
  ]
});


// --- ESTILOS DO PDF ---
// Os estilos são definidos como objetos JavaScript, similar ao React Native.
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 30,
    color: '#333',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a202c',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: 5,
    padding: 10,
    width: '48%', // Para 2 colunas
  },
  cardTitle: {
    fontSize: 12,
    color: '#718096',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e2e8f0',
    padding: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f7fafc',
  },
  tableCol: {
    width: '50%',
  }
});

// --- O COMPONENTE DO DOCUMENTO ---
export function ReportPDFDocument({ data }: { data: ReportData }) {
  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Relatório Geral de Estoque</Text>

        {/* Seção de Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <View style={styles.grid}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Total de Produtos</Text>
              <Text style={styles.cardValue}>{data.summaryCards.totalProducts}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Valor do Estoque</Text>
              <Text style={styles.cardValue}>{formatCurrency(data.summaryCards.stockValue)}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Movimentações</Text>
              <Text style={styles.cardValue}>{data.summaryCards.totalMovements}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Estoque Baixo</Text>
              <Text style={styles.cardValue}>{data.summaryCards.lowStockProducts}</Text>
            </View>
          </View>
        </View>

        {/* Seção de Produtos por Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos por Categoria</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCol}>Categoria</Text>
              <Text style={styles.tableCol}>Quantidade</Text>
            </View>
            {data.productsByCategory.map(item => (
              <View key={item.name} style={styles.tableRow}>
                <Text style={styles.tableCol}>{item.name}</Text>
                <Text style={styles.tableCol}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Seção de Valor por Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor por Categoria</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCol}>Categoria</Text>
              <Text style={styles.tableCol}>Valor Total</Text>
            </View>
            {data.valueByCategory.map(item => (
              <View key={item.name} style={styles.tableRow}>
                <Text style={styles.tableCol}>{item.name}</Text>
                <Text style={styles.tableCol}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
