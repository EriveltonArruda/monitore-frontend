'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

type Payment = {
  id: number;
  accountId: number;
  paidAt: string;
  amount: number;
  createdAt: string;
  bankAccount?: string | null;
};

interface Props {
  accountId: number;
  onClose: () => void;
}

export function PaymentHistoryModal({ accountId, onClose }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600">X</button>
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>

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
                <p>
                  <strong>Conta bancária usada:</strong>{' '}
                  {payment.bankAccount || 'Não informado'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
