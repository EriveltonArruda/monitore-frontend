'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

type Payment = {
  id: number;
  accountId: number;
  paidAt: string;
  amount: number;
  createdAt: string;
};

interface Props {
  accountId: number;
  onClose: () => void;
}

export function PaymentHistoryModal({ accountId, onClose }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [newPaidAt, setNewPaidAt] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [accountId]);

  async function fetchPayments() {
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

  async function handleAddPayment() {
    if (!newPaidAt || !newAmount) {
      alert('Preencha a data e o valor.');
      return;
    }

    setIsSubmitting(true);

    try {
      await fetch('http://localhost:3001/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          paidAt: newPaidAt,
          amount: parseFloat(newAmount),
        }),
      });

      await fetchPayments(); // recarrega a lista
      setShowForm(false);
      setNewPaidAt('');
      setNewAmount('');
    } catch (error) {
      alert('Erro ao adicionar pagamento.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600">X</button>
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`mb-4 px-4 py-2 rounded text-white font-medium transition ${showForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {showForm ? 'Cancelar' : 'Adicionar pagamento'}
        </button>

        {showForm && (
          <div className="mb-4 space-y-2">
            <input
              type="datetime-local"
              value={newPaidAt}
              onChange={(e) => setNewPaidAt(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Valor"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <button
              onClick={handleAddPayment}
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Pagamento'}
            </button>
          </div>
        )}

        {loading ? (
          <p>Carregando...</p>
        ) : payments.length === 0 ? (
          <p>Nenhum pagamento encontrado.</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment.id} className="border p-2 rounded">
                <p><strong>Pago em:</strong> {format(new Date(payment.paidAt), 'dd/MM/yyyy HH:mm')}</p>
                <p>
                  <strong>Valor:</strong>{' '}
                  {typeof payment.amount === 'number'
                    ? payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '---'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
