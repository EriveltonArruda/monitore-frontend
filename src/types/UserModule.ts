// src/types/UserModule.ts
export enum UserModule {
  // Financeiro — Contas a Pagar
  CONTAS_PAGAR = 'CONTAS_PAGAR',
  RELATORIO_CONTAS_PAGAR = 'RELATORIO_CONTAS_PAGAR',

  // Estoque
  ESTOQUE = 'ESTOQUE',
  MOVIMENTACOES = 'MOVIMENTACOES',
  CATEGORIAS = 'CATEGORIAS',
  FORNECEDORES = 'FORNECEDORES',

  // Prefeitura / Contratos / Recebíveis
  CONTRATOS = 'CONTRATOS',
  RECEBIVEIS = 'RECEBIVEIS',
  MUNICIPIOS = 'MUNICIPIOS',
  ORGAOS_SECRETARIAS = 'ORGAOS',

  // Relatórios gerais (guarda-chuva; pode coexistir com os específicos)
  RELATORIOS = 'RELATORIOS',

  // Outros
  CONTATOS = 'CONTATOS',
  DESPESAS_VIAGEM = 'DESPESAS_VIAGEM',
  USUARIOS = 'USUARIOS',
  DASHBOARD = 'DASHBOARD',
}

/** Modelo mínimo esperado no front para checagem de permissão por módulo */
export type UserWithModules = {
  id: number;
  name: string;
  email: string;
  modules: UserModule[];
};
