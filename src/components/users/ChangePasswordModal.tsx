"use client";

import { X } from 'lucide-react';
import { FormEvent, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

type ChangePasswordModalProps = {
  onClose: () => void;
  userId: number;
};

export function ChangePasswordModal({ onClose, userId }: ChangePasswordModalProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não correspondem.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const token = Cookies.get('auth_token');

    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao alterar a senha.');
      }

      alert('Senha alterada com sucesso!');
      onClose(); // Fecha o modal
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Alterar Senha</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Nova Senha *</label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full border-gray-300 rounded-md p-2 border mt-1"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">Confirmar Nova Senha *</label>
            <input
              type="password" id="confirmPassword" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required
              className="w-full border-gray-300 rounded-md p-2 border mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg">
              {isSubmitting ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
