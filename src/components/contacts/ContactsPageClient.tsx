"use client";

import React, { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ContactFormModal } from './ContactFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';

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
};

export function ContactsPageClient({ initialContacts }: ContactsPageClientProps) {
  const router = useRouter();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => { setEditingContact(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (contact: Contact) => { setEditingContact(contact); setIsFormModalOpen(true); };
  const handleOpenDeleteModal = (contact: Contact) => { setDeletingContact(contact); setIsDeleteModalOpen(true); };
  const handleCloseModals = () => { setIsFormModalOpen(false); setIsDeleteModalOpen(false); setEditingContact(null); setDeletingContact(null); };

  const handleDeleteConfirm = async () => {
    if (!deletingContact) return;
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:3001/contacts/${deletingContact.id}`, { method: 'DELETE' });
      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar o contato.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {isFormModalOpen && (
        <ContactFormModal
          onClose={handleCloseModals}
          contactToEdit={editingContact}
        />
      )}
      {isDeleteModalOpen && deletingContact && (
        <DeleteConfirmationModal
          itemName={deletingContact.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Lista de Contatos</h1>
            <p className="text-sm text-gray-500">Gerencie seus clientes, fornecedores e parceiros</p>
          </div>
          <button onClick={handleOpenCreateModal} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusCircle size={20} />
            <span>Novo Contato</span>
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">Empresa</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Telefone</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialContacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-4 font-medium">{contact.name}</td>
                  <td className="p-4 text-gray-600">{contact.company || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.email || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.phone || '-'}</td>
                  <td className="p-4 text-gray-600">{contact.type}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleOpenEditModal(contact)} className="text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
                      <button onClick={() => handleOpenDeleteModal(contact)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}