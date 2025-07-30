"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pagination } from "@/components/Pagination";

// Lista fixa de categorias para o filtro (ajuste conforme necessário)
const categoryOptions = [
  { value: "TODAS", label: "Todas as Categorias" },
  { value: "Aluguel", label: "Aluguel" },
  { value: "Energia", label: "Energia" },
  { value: "Internet", label: "Internet" },
];

// Novo: lista de meses para o filtro
const monthOptions = [
  { value: "", label: "Todos os Meses" },
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

// Tipo dos dados do relatório
type ReportItem = {
  month: string;
  total: number;
  paid: number;
  pending: number;
  count: number;
};

export default function AccountsPayableReportsPage() {
  // Estados dos dados, loading, filtros
  const [data, setData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12; // meses por página

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    yearOptions.push(y);
  }

  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [selectedMonth, setSelectedMonth] = useState(""); // Novo filtro de mês

  // Lê o valor da página da URL (?page=2)
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Number(pageParam) : 1;

  // Busca os dados do relatório sempre que filtro/página mudar
  useEffect(() => {
    setLoading(true);
    const url = `/api/accounts-payable/reports/month?year=${selectedYear}&category=${selectedCategory}&page=${currentPage}&limit=${limit}`;
    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotal(result.total || 0);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, selectedCategory, currentPage]);

  // Função para exibir o mês em extenso
  function formatMonth(monthString: string) {
    const [year, month] = monthString.split("-");
    const date = parse(`${year}-${month}-01`, "yyyy-MM-dd", new Date());
    return format(date, "MMMM/yyyy", { locale: ptBR });
  }

  // Novo: filtra pelo mês selecionado
  const filteredData = selectedMonth
    ? data.filter(item => item.month.endsWith(`-${selectedMonth}`))
    : data;

  // Calcula os totais gerais dos dados exibidos na página atual
  const totals = filteredData.reduce(
    (acc, item) => {
      acc.count += item.count;
      acc.total += item.total;
      acc.paid += item.paid;
      acc.pending += item.pending;
      return acc;
    },
    { count: 0, total: 0, paid: 0, pending: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Relatório de Contas a Pagar</h1>
          <p className="text-sm text-gray-500">
            Veja o resumo mensal das suas contas, valores pagos e pendentes
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        {/* Ano */}
        <div className="flex items-center gap-2">
          <label htmlFor="ano" className="text-sm text-gray-700">Ano:</label>
          <select
            id="ano"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        {/* Categoria */}
        <div className="flex items-center gap-2">
          <label htmlFor="categoria" className="text-sm text-gray-700">Categoria:</label>
          <select
            id="categoria"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Mês */}
        <div className="flex items-center gap-2">
          <label htmlFor="mes" className="text-sm text-gray-700">Mês:</label>
          <select
            id="mes"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Card de totais gerais */}
      {filteredData.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500">Total de Contas</span>
            <span className="text-lg font-bold text-gray-700">{totals.count}</span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500">Valor Total</span>
            <span className="text-lg font-bold text-blue-600">
              {totals.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500">Total Pago</span>
            <span className="text-lg font-bold text-green-600">
              {totals.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
            <span className="text-xs text-gray-500">Total Pendente</span>
            <span className="text-lg font-bold text-red-600">
              {totals.pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
        </div>
      )}

      {/* Card da tabela de relatório */}
      <div className="bg-white p-4 rounded-xl shadow-sm mt-6">
        <table className="w-full table-auto">
          <thead className="text-left border-b-2 border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Mês</th>
              <th className="p-4 font-semibold text-gray-600">Total de Contas</th>
              <th className="p-4 font-semibold text-gray-600">Valor Total</th>
              <th className="p-4 font-semibold text-gray-600">Valor Pago</th>
              <th className="p-4 font-semibold text-gray-600">Valor Pendente</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Nenhum dado para exibir.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.month} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-4 font-medium text-gray-800">{formatMonth(item.month)}</td>
                  <td className="p-4 text-gray-600">{item.count}</td>
                  <td className="p-4 text-gray-600">
                    {item.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="p-4 text-green-700 font-semibold">
                    {item.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="p-4 text-red-700 font-semibold">
                    {item.pending.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
