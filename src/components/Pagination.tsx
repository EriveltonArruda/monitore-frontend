// Este componente agora constrói os links em vez de chamar uma função.
"use client";

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Função para criar a URL de uma página específica, mantendo os filtros atuais
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <ChevronLeft size={16} />
        Anterior
      </Link>

      <span className="text-sm text-gray-600">
        Página {currentPage} de {totalPages}
      </span>

      <Link
        href={createPageURL(currentPage + 1)}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        Próximo
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}