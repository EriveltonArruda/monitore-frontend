// lib/print/config.ts
export const currencyBR = (n: any) =>
  typeof n === 'number'
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : n ?? '—';

export const dateBR = (d: any) => (d ? new Date(d).toLocaleString('pt-BR') : '—');

type Col = { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string };

type KindConfig = {
  title: string;
  subtitle?: (sp: Record<string, any>) => string | null;
  endpoint: string; // relativo ao API_BASE
  columns: Col[];
  formatters?: Record<string, (v: any, row: any) => any>;
};

// 🔧 registre aqui cada relatório
export const kinds: Record<string, KindConfig> = {
  // Produtos
  products: {
    title: 'Relatório de Produtos',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.status ? `Status: ${sp.status}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    endpoint: '/products',
    columns: [
      { key: 'id', label: '#', width: '80px' },
      { key: 'name', label: 'Produto' },
      { key: 'sku', label: 'SKU', width: '140px' },
      { key: 'stockQuantity', label: 'Estoque', align: 'right', width: '120px' },
      { key: 'costPrice', label: 'Custo', align: 'right', width: '140px' },
      { key: 'status', label: 'Status', width: '120px' },
    ],
    formatters: {
      costPrice: (v) => currencyBR(Number(v)),
    },
  },

  // Movimentações de estoque
  'stock-movements': {
    title: 'Relatório de Movimentações de Estoque',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.dateFrom ? `De: ${sp.dateFrom}` : null,
        sp.dateTo ? `Até: ${sp.dateTo}` : null,
        sp.type ? `Tipo: ${sp.type}` : null,
        sp.productId ? `Produto: ${sp.productId}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    endpoint: '/stock-movements',
    columns: [
      { key: 'id', label: '#', width: '80px' },
      { key: 'type', label: 'Tipo', width: '110px' },
      { key: 'productName', label: 'Produto' },
      { key: 'quantity', label: 'Qtd', align: 'right', width: '100px' },
      { key: 'unitPriceAtMovement', label: 'Vlr Unit', align: 'right', width: '140px' },
      { key: 'createdAt', label: 'Data', width: '180px' },
      { key: 'details', label: 'Detalhes' },
    ],
    formatters: {
      unitPriceAtMovement: (v) => (v != null ? currencyBR(Number(v)) : '—'),
      createdAt: (v) => dateBR(v),
    },
  },

  // Contas a pagar (mantido para a página /dashboard/print/contas-a-pagar, caso usem)
  'accounts-payable': {
    title: 'Relatório de Contas a Pagar',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.status ? `Status: ${sp.status}` : null,
        sp.dateFrom ? `Venc. de ${sp.dateFrom}` : null,
        sp.dateTo ? `até ${sp.dateTo}` : null,
        sp.category ? `Categoria: ${sp.category}` : null,
      ]
        .filter(Boolean)
        .join(' · ') || null,
    endpoint: '/accounts-payable',
    columns: [
      { key: 'id', label: '#', width: '80px' },
      { key: 'name', label: 'Conta' },
      { key: 'category', label: 'Categoria', width: '160px' },
      { key: 'value', label: 'Valor', align: 'right', width: '140px' },
      { key: 'dueDate', label: 'Vencimento', width: '160px' },
      { key: 'status', label: 'Status', width: '120px' },
    ],
    formatters: {
      value: (v) => currencyBR(Number(v)),
      dueDate: (v) => dateBR(v),
    },
  },

  // Contratos
  contracts: {
    title: 'Relatório de Contratos',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.municipalityId ? `Município: ${sp.municipalityId}` : null,
        sp.departmentId ? `Órgão: ${sp.departmentId}` : null,
        sp.endFrom ? `Fim de: ${sp.endFrom}` : null,
        sp.endTo ? `Fim até: ${sp.endTo}` : null,
        sp.expiredOnly === 'true' ? 'Apenas expirados' : null,
        sp.dueInDays ? `Vencendo em: ${sp.dueInDays}d` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/contracts',
    columns: [
      { key: 'id', label: '#', width: '70px' },
      { key: 'code', label: 'Código', width: '140px' },
      { key: 'municipalityName', label: 'Município' },
      { key: 'departmentName', label: 'Órgão' },
      { key: 'period', label: 'Vigência', width: '200px' },
      { key: 'monthlyValue', label: 'Valor Mensal', align: 'right', width: '150px' },
      { key: 'alert', label: 'Alerta', width: '120px' },
    ],
    formatters: {
      municipalityName: (_v, row) => row?.municipality?.name ?? '—',
      departmentName: (_v, row) => row?.department?.name ?? '—',
      period: (_v, row) => {
        const a = row?.startDate ? dateBR(row.startDate) : '—';
        const b = row?.endDate ? dateBR(row.endDate) : '—';
        return `${a} → ${b}`;
      },
      monthlyValue: (v) => currencyBR(Number(v)),
      alert: (_v, row) => row?.alertTag ?? '—',
    },
  },

  // Recebíveis
  receivables: {
    title: 'Relatório de Recebíveis',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.municipalityId ? `Município: ${sp.municipalityId}` : null,
        sp.departmentId ? `Órgão: ${sp.departmentId}` : null,
        sp.contractId ? `Contrato: ${sp.contractId}` : null,
        sp.status ? `Status: ${sp.status}` : null,
        sp.issueFrom ? `Emissão de ${sp.issueFrom}` : null,
        sp.issueTo ? `até ${sp.issueTo}` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/receivables',
    columns: [
      { key: 'id', label: '#', width: '70px' },
      { key: 'contractCode', label: 'Contrato', width: '160px' },
      { key: 'noteNumber', label: 'NF', width: '120px' },
      { key: 'period', label: 'Período', width: '220px' },
      { key: 'issueDate', label: 'Emissão', width: '140px' },
      { key: 'netAmount', label: 'Valor Líquido', align: 'right', width: '160px' },
      { key: 'status', label: 'Status', width: '120px' },
    ],
    formatters: {
      contractCode: (_v, row) => row?.contract?.code ?? '—',
      period: (_v, row) => {
        const a = row?.periodStart ? dateBR(row.periodStart) : null;
        const b = row?.periodEnd ? dateBR(row.periodEnd) : null;
        return a || b ? `${a ?? '—'} → ${b ?? '—'}` : row?.periodLabel ?? '—';
      },
      issueDate: (v) => dateBR(v),
      netAmount: (v) => currencyBR(Number(v)),
      status: (v) => v ?? '—',
    },
  },

  // Fornecedores
  suppliers: {
    title: 'Relatório de Fornecedores',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/suppliers',
    columns: [
      { key: 'id', label: '#', width: '70px' },
      { key: 'name', label: 'Nome da Empresa' },
      { key: 'cnpj', label: 'CNPJ', width: '160px' },
      { key: 'phone', label: 'Telefone', width: '150px' },
      { key: 'email', label: 'Email', width: '220px' },
    ],
  },

  // ✅ Contatos
  contacts: {
    title: 'Relatório de Contatos',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/contacts',
    columns: [
      { key: 'id', label: '#', width: '70px' },
      { key: 'name', label: 'Nome' },
      { key: 'company', label: 'Empresa', width: '220px' },
      { key: 'email', label: 'Email', width: '240px' },
      { key: 'phone', label: 'Telefone', width: '160px' },
      { key: 'type', label: 'Tipo', width: '120px' },
    ],
  },

  // ✅ Municípios (NOVO)
  municipalities: {
    title: 'Relatório de Municípios',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/municipalities',
    columns: [
      { key: 'id', label: '#', width: '80px' },
      { key: 'name', label: 'Município' },
    ],
  },

  // ✅ Órgãos/Secretarias (NOVO)
  departments: {
    title: 'Relatório de Órgãos/Secretarias',
    subtitle: (sp) =>
      [
        sp.search ? `Filtro: "${sp.search}"` : null,
        sp.municipalityId ? `Município: ${sp.municipalityId}` : null,
      ].filter(Boolean).join(' · ') || null,
    endpoint: '/departments',
    columns: [
      { key: 'id', label: '#', width: '80px' },
      { key: 'name', label: 'Órgão/Secretaria' },
      { key: 'municipalityName', label: 'Município', width: '260px' },
    ],
    formatters: {
      municipalityName: (_v, row) => row?.municipality?.name ?? '—',
    },
  },
};
