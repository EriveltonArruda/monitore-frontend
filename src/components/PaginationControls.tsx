"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePathname, useSearchParams } from "next/navigation";

type PaginationControlsProps = {
  totalPages: number;
  currentPage: number;
};

export function PaginationControls({
  totalPages,
  currentPage,
}: PaginationControlsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Função para criar a URL de uma página específica, mantendo os filtros atuais
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  // Não renderiza nada se houver apenas uma página
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {/* Botão "Anterior" */}
        <PaginationItem>
          <PaginationPrevious
            href={createPageURL(currentPage - 1)}
            // Desabilita o link se estivermos na primeira página
            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>

        {/* Lógica para exibir os números das páginas (simplificada) */}
        <PaginationItem>
          <PaginationLink href="#" isActive>
            {currentPage}
          </PaginationLink>
        </PaginationItem>

        {/* Se houver mais páginas, mostra o '...' */}
        {currentPage < totalPages && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Botão "Próximo" */}
        <PaginationItem>
          <PaginationNext
            href={createPageURL(currentPage + 1)}
            // Desabilita o link se estivermos na última página
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
