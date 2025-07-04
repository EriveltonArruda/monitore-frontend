"use client";

import React, { useState } from 'react';
import { PlusCircle, Trash2, KeyRound } from 'lucide-react'; // Importamos o novo ícone
import { useRouter } from 'next/navigation';
import { UserFormModal } from './UserFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { ChangePasswordModal } from './ChangePasswordModal'; // Importamos o novo modal
import Cookies from 'js-cookie';

type User = {
  id: number;
  name: string;
  email: string;
};

type UsersPageClientProps = {
  initialUsers: User[];
};

export function UsersPageClient({ initialUsers }: UsersPageClientProps) {
  const router = useRouter();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false); // Novo estado

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [changingPasswordForUser, setChangingPasswordForUser] = useState<User | null>(null); // Novo estado

  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDeleteModal = (user: User) => { setDeletingUser(user); setIsDeleteModalOpen(true); };

  // Nova função para abrir o modal de alterar senha
  const handleOpenChangePasswordModal = (user: User) => {
    setChangingPasswordForUser(user);
    setIsChangePasswordModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsChangePasswordModalOpen(false);
    setDeletingUser(null);
    setChangingPasswordForUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    const token = Cookies.get('auth_token'); // Pega o token para a requisição

    try {
      const response = await fetch(`http://localhost:3001/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar usuário.');
      }

      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar o usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {isFormModalOpen && <UserFormModal onClose={handleCloseModals} />}
      {isDeleteModalOpen && deletingUser && (
        <DeleteConfirmationModal
          itemName={deletingUser.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      {/* Renderização condicional do novo modal */}
      {isChangePasswordModalOpen && changingPasswordForUser && (
        <ChangePasswordModal
          onClose={handleCloseModals}
          userId={changingPasswordForUser.id}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
            <p className="text-sm text-gray-500">Adicione ou remova usuários do sistema</p>
          </div>
          <button onClick={() => setIsFormModalOpen(true)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2">
            <PlusCircle size={20} />
            <span>Novo Usuário</span>
          </button>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <table className="w-full table-auto">
            <thead className="text-left border-b-2 border-gray-100">
              <tr>
                <th className="p-4 font-semibold">Nome</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50 last:border-b-0">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <div className="flex gap-4">
                      {/* Novo botão de alterar senha */}
                      <button onClick={() => handleOpenChangePasswordModal(user)} className="text-gray-400 hover:text-blue-600">
                        <KeyRound size={18} />
                      </button>
                      <button onClick={() => handleOpenDeleteModal(user)} className="text-gray-400 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
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