// components/DeleteConfirmationModal.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";

type DeleteConfirmationModalProps = {
  itemName: string;
  onConfirm: () => void;
  onClose: () => void;
  isDeleting: boolean;
  /** Texto opcional do título */
  title?: string;
  /** Mensagem opcional (se não passar, uso uma genérica) */
  message?: string;
};

export function DeleteConfirmationModal({
  itemName,
  onConfirm,
  onClose,
  isDeleting,
  title = "Confirmar Exclusão",
  message,
}: DeleteConfirmationModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Foco inicial no "Cancelar"
    cancelBtnRef.current?.focus();

    // Fechar com ESC
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const defaultMessage = (
    <>
      Você tem certeza que deseja excluir{" "}
      <strong className="font-bold">“{itemName}”</strong>? Esta ação não pode
      ser desfeita.
    </>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
            <TriangleAlert className="text-red-600" size={24} />
          </div>
          <div>
            <h2 id="delete-modal-title" className="text-xl font-bold text-gray-800">
              {title}
            </h2>
            <p className="text-gray-600 mt-2">{message ?? defaultMessage}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            ref={cancelBtnRef}
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
            {isDeleting ? "Excluindo..." : "Sim, Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
