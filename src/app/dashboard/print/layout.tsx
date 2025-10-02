// app/dashboard/print/layout.tsx
export default function PrintLayoutRoot({ children }: { children: React.ReactNode }) {
  return (
    <div id="print-root" className="min-h-screen bg-white text-black p-6">
      {/* CSS de impressão SEM styled-jsx (apenas <style>) */}
      <style>{`
        @media print {
          /* Esconde tudo... */
          body * {
            visibility: hidden !important;
          }
          /* ...exceto o conteúdo do print */
          #print-root,
          #print-root * {
            visibility: visible !important;
          }
          /* Posiciona o print no topo e ocupa a largura toda */
          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Margem da página impressa */
          @page {
            margin: 12mm;
          }
        }
      `}</style>

      {children}
    </div>
  );
}
