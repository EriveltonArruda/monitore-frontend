// components/Pagination.tsx
"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  /** classe extra opcional no wrapper */
  className?: string;
  /** tamanho opcional dos botões */
  size?: "sm" | "md";
};

export function Pagination({
  currentPage,
  totalPages,
  className = "",
  size = "md",
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!totalPages || totalPages <= 1) return null;

  const clamp = (n: number) => Math.min(Math.max(n, 1), totalPages);

  const pageClasses = size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2 text-sm";

  // Cria URL mantendo filtros atuais e garantindo limites válidos
  const createPageURL = (pageNumber: number) => {
    const p = clamp(pageNumber);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      className={`flex items-center justify-center gap-4 mt-8 ${className}`}
      role="navigation"
      aria-label="Paginação"
    >
      <Link
        href={createPageURL(currentPage - 1)}
        prefetch={false}
        aria-disabled={isFirst}
        aria-label="Página anterior"
        rel="prev"
        className={`flex items-center gap-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 ${pageClasses} ${isFirst ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
          }`}
      >
        <ChevronLeft size={16} />
        Anterior
      </Link>

      <span className="text-sm text-gray-600">
        Página {clamp(currentPage)} de {totalPages}
      </span>

      <Link
        href={createPageURL(currentPage + 1)}
        prefetch={false}
        aria-disabled={isLast}
        aria-label="Próxima página"
        rel="next"
        className={`flex items-center gap-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 ${pageClasses} ${isLast ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
          }`}
      >
        Próximo
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
