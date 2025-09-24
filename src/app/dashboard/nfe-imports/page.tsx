// app/dashboard/nfe-imports/page.tsx
import { NfeImportsClient } from '@/components/nfe-imports/NfeImportsClient';

export default async function Page() {
  // server component “casca”; a lista em si é carregada no client component
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Importações de NF-e (XML)</h1>
      <NfeImportsClient />
    </div>
  );
}
