"use client";

import { TriangleAlert } from 'lucide-react';

type DeleteConfirmationModalProps = {
  itemName: string;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
};

export function DeleteConfirmationModal({
  itemName,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
            <TriangleAlert className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h2>
            <p className="text-gray-600 mt-2">
              Você tem certeza que deseja excluir a categoria{' '}
              <strong className="font-bold">"{itemName}"</strong>? Esta ação não
              pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-300"
          >
            {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
