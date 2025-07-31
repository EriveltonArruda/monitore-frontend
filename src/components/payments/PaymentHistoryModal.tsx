'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

// Define o tipo do objeto Payment recebido da API
type Payment = {
  id: number;
  accountId: number;
  paidAt: string;
  amount: number;
  createdAt: string;
  bankAccount?: string | null;
};

// Props do modal
interface Props {
  accountId: number;
  onClose: () => void;
}

// Componente principal do modal de histórico de pagamentos
export function PaymentHistoryModal({ accountId, onClose }: Props) {
  // Lista de pagamentos carregados da API
  const [payments, setPayments] = useState<Payment[]>([]);
  // Estado de loading durante busca
  const [loading, setLoading] = useState(true);

  // Estado para edição (qual pagamento está sendo editado)
  const [editing, setEditing] = useState<Payment | null>(null);
  // Estado do formulário de edição (campos controlados)
  const [editForm, setEditForm] = useState<{ paidAt: string; amount: string; bankAccount: string }>({ paidAt: '', amount: '', bankAccount: '' });

  // Estado do pagamento sendo deletado (não é modal separado, só para feedback)
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Sempre que a conta mudar, busca os pagamentos dela
  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line
  }, [accountId]);

  // Função para buscar pagamentos do backend
  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/payments?accountId=${accountId}`);
      const data = await res.json();
      setPayments(data);
    } catch (error) {
      console.error('Erro ao buscar histórico de pagamentos', error);
    } finally {
      setLoading(false);
    }
  }

  // --- EDIÇÃO ---
  // Ao clicar em "Editar", popula o formulário com os dados atuais daquele pagamento
  function handleStartEdit(payment: Payment) {
    setEditing(payment);
    setEditForm({
      paidAt: payment.paidAt.slice(0, 16), // formato yyyy-MM-ddTHH:mm para input datetime-local
      amount: String(payment.amount).replace('.', ','),
      bankAccount: payment.bankAccount || '',
    });
  }

  // Atualiza estado do formulário a cada digitação
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Salva alteração no backend (PATCH)
  async function handleEditSave() {
    if (!editing) return;
    try {
      const body = {
        paidAt: editForm.paidAt,
        amount: Number(editForm.amount.replace(',', '.')), // Converte vírgula para ponto
        bankAccount: editForm.bankAccount || null,
      };
      await fetch(`http://localhost:3001/payments/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setEditing(null);        // Fecha edição
      await fetchPayments();   // Atualiza lista
    } catch (error) {
      alert('Erro ao atualizar pagamento');
    }
  }

  // --- REMOÇÃO ---
  // Chama o backend para deletar e atualiza lista
  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este pagamento?')) return;
    try {
      await fetch(`http://localhost:3001/payments/${id}`, { method: 'DELETE' });
      await fetchPayments();
    } catch {
      alert('Erro ao excluir pagamento');
    }
  }

  // --- RENDERIZAÇÃO ---
  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        {/* Botão de fechar */}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600">X</button>
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>

        {/* Loading, vazio, ou lista */}
        {loading ? (
          <p>Carregando...</p>
        ) : payments.length === 0 ? (
          <p>Nenhum pagamento encontrado.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment.id} className="border p-2 rounded flex flex-col gap-2 relative group">
                {/* Modo edição */}
                {editing && editing.id === payment.id ? (
                  <div className="space-y-2">
                    <label className="block text-sm">
                      Pago em:
                      <input
                        type="datetime-local"
                        name="paidAt"
                        value={editForm.paidAt}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </label>
                    <label className="block text-sm">
                      Valor:
                      <input
                        type="text"
                        name="amount"
                        value={editForm.amount}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </label>
                    <label className="block text-sm">
                      Conta bancária usada:
                      <input
                        type="text"
                        name="bankAccount"
                        value={editForm.bankAccount}
                        onChange={handleEditChange}
                        className="border rounded px-2 py-1 w-full"
                      />
                    </label>
                    {/* Botões salvar/cancelar */}
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleEditSave} className="px-3 py-1 bg-blue-600 text-white rounded">Salvar</button>
                      <button onClick={() => setEditing(null)} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  // Modo visualização normal
                  <>
                    <p><strong>Pago em:</strong> {format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm')}</p>
                    <p>
                      <strong>Valor:</strong>{' '}
                      {typeof payment.amount === 'number'
                        ? payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '---'}
                    </p>
                    <p>
                      <strong>Conta bancária usada:</strong>{' '}
                      {payment.bankAccount || 'Não informado'}
                    </p>
                    {/* Botões editar e excluir */}
                    <div className="flex gap-2 mt-1">
                      <button
                        className="text-blue-600 hover:underline text-xs"
                        onClick={() => handleStartEdit(payment)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-600 hover:underline text-xs"
                        onClick={() => handleDelete(payment.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
