import { ContactsPageClient } from '@/components/contacts/ContactsPageClient';
import { RequireModule } from "@/components/RequireModule";
import { UserModule } from "@/types/UserModule";

type Contact = {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  type: string;
};

// A função de busca agora aceita parâmetros de paginação
async function getPaginatedContacts(params: URLSearchParams) {
  const response = await fetch(`http://localhost:3001/contacts?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    return { data: [], total: 0 };
  }
  return response.json();
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const params = new URLSearchParams();
  const page = resolvedSearchParams['page'] ?? '1';
  params.append('page', String(page));
  params.append('limit', '10');

  const search = Array.isArray(resolvedSearchParams['search'])
    ? resolvedSearchParams['search'][0]
    : resolvedSearchParams['search'] || '';
  if (search) {
    params.append('search', search);
  }

  const paginatedContacts = await getPaginatedContacts(params);

  return (
    <RequireModule module={UserModule.CONTATOS}>
      <ContactsPageClient
        initialContacts={paginatedContacts.data}
        totalContacts={paginatedContacts.total}
      />
    </RequireModule>
  );
}