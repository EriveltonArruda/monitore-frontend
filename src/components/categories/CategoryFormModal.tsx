"use client";

import { X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = { id: number; name: string };

type CategoryFormModalProps = {
  onClose: () => void;
  categoryToEdit?: Category | null;
};

export function CategoryFormModal({
  onClose,
  categoryToEdit,
}: CategoryFormModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(categoryToEdit);

  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && categoryToEdit) {
      setName(categoryToEdit.name);
    }
  }, [isEditMode, categoryToEdit]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let response;

      // CORREÇÃO: Separamos a lógica de Edição e Criação em blocos 'if/else'.
      // Isso torna explícito para o TypeScript que dentro do bloco 'if(isEditMode)',
      // a variável 'categoryToEdit' não pode ser nula.
      if (isEditMode) {
        // Verificação de segurança extra.
        if (!categoryToEdit) {
          throw new Error("Erro: Categoria para edição não foi encontrada.");
        }

        const url = `http://localhost:3001/categories/${categoryToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });

      } else {
        // Lógica de Criação
        const url = 'http://localhost:3001/categories';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar categoria.');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button" onClick={onClose} disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
