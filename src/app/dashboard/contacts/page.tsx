import { ContactsPageClient } from '@/components/contacts/ContactsPageClient';

// Definimos o tipo de dados que esperamos da nossa API.
type Contact = {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  type: string;
};

// Função para buscar os dados do nosso backend.
async function getContacts(): Promise<Contact[]> {
  const response = await fetch('http://localhost:3001/contacts', {
    cache: 'no-store', // Sempre buscar os dados mais recentes.
  });

  if (!response.ok) {
    throw new Error('Falha ao buscar contatos');
  }

  return response.json();
}

// O Server Component busca os dados e os passa para o Client Component.
export default async function ContactsPage() {
  const contacts = await getContacts();
  return <ContactsPageClient initialContacts={contacts} />;
}
