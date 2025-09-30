"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2, Printer, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ContactFormModal } from './ContactFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { Pagination } from '../Pagination';
import Topbar from '../layout/Topbar';

type Contact = {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  type: string;
};

type ContactsPageClientProps = {
  initialContacts: Contact[];
  totalContacts: number;
};

const ITEMS_PER_PAGE = 10;

export function ContactsPageClient({ initialContacts, totalContacts }: ContactsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Impressão (preserva filtros atuais)
  const handlePrint = () => {
    const qs = new URLSearchParams();
    const s = searchParams.get('search');
    if (s) qs.set('search', s);
    router.push(`/dashboard/print/contatos?${qs.toString()}`);
  };

  // Chips / limpar
  const qSearch = searchParams.get('search') || '';
  const hasActive = !!qSearch;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };
  const clearFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  // Exclusão
  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/contacts/${deletingContact.id}`, { method: 'DELETE' });
      router.refresh();
      setIsDeleteModalOpen(false);
      setDeletingContact(null);
    } catch {
      alert('Ocorreu um erro ao deletar o contato.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Paginação
  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  // Ações de modal
  const openCreate = () => { setEditingContact(null); setIsFormModalOpen(true); };
  const openEdit = (c: Contact) => { setEditingContact(c); setIsFormModalOpen(true); };

  return (
    <>
      {isFormModalOpen && (
        <ContactFormModal
          onClose={() => setIsFormModalOpen(false)}
          contactToEdit={editingContact}
        />
      )}
      {isDeleteModalOpen && deletingContact && (
        <DeleteConfirmationModal
          itemName={deletingContact.name}
          onConfirm={handleDeleteConfirm}
          onClose={() => { setIsDeleteModalOpen(false); setDeletingContact(null); }}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* TOPBAR com busca integrada (atualiza ?search= e reseta page=1) */}
        <Topbar
          title="Lista de Contatos"
          subtitle="Gerencie seus clientes, fornecedores e parceiros"
          withSearch
          searchPlaceholder="Buscar contato…"
          actions={
            <>
              <button
                onClick={handlePrint}
                className="border text-gray-700 hover:bg-gray-50 font-medium py-2 px-3 rounded-lg flex items-center gap-2"
                title="Imprimir (com filtros atuais)"
              >
                <Printer size={18} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <PlusCircle size={20} />
                <span>Novo Contato</span>
              </button>
            </>
          }
        />

        {/* Chips de filtros ativos */}
        {hasActive && (
          <div className="bg-white p-3 rounded-xl shadow-sm mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Filtros ativos:</span>

            {!!qSearch && (
              <button
                className="inline-flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full"
                onClick={() => removeFilter('search')}
                title={`Remover busca: “${qSearch}”`}
              >
                <span>Busca: “{qSearch}”</span>
                <X size={12} />
              </button>
            )}

            <div className="grow" />
            <button
              className="text-xs text-blue-700 hover:underline"
              onClick={clearFilters}
              title="Limpar todos os filtros"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Nome</th>
                <th className="p-4 font-semibold text-gray-600">Empresa</th>
                <th className="p-4 font-semibold text-gray-600">Email</th>
                <th className="p-4 font-semibold text-gray-600">Telefone</th>
                <th className="p-4 font-semibold text-gray-600">Tipo</th>
                <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialContacts.map((contact) => (
                <tr key={contact.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{contact.name}</td>
                  <td className="p-4 text-gray-600">{contact.company || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.email || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.phone || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.type}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <button onClick={() => openEdit(contact)} className="text-gray-400 hover:text-blue-600">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => { setDeletingContact(contact); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {initialContacts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    Nenhum contato encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
