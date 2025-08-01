"use client";

import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, KeyRound, Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { UserFormModal } from './UserFormModal';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { Pagination } from '../Pagination';
import Cookies from 'js-cookie';

type User = {
  id: number;
  name: string;
  email: string;
};

type UsersPageClientProps = {
  initialUsers: User[];
  totalUsers: number;
};

const ITEMS_PER_PAGE = 10;

export function UsersPageClient({ initialUsers, totalUsers }: UsersPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Estado para campo de busca
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Estados para modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Estados para ações
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [changingPasswordForUser, setChangingPasswordForUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Atualiza a URL com o filtro de busca
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Sempre volta para a primeira página ao filtrar

    const debounceTimer = setTimeout(() => {
      router.push(`${pathname}?${params.toString()}`);
    }, 300);

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line
  }, [searchTerm, pathname, router]);

  // Funções para abrir os modais
  const handleOpenDeleteModal = (user: User) => { setDeletingUser(user); setIsDeleteModalOpen(true); };
  const handleOpenChangePasswordModal = (user: User) => { setChangingPasswordForUser(user); setIsChangePasswordModalOpen(true); };
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsChangePasswordModalOpen(false);
    setDeletingUser(null);
    setChangingPasswordForUser(null);
  };

  // Função para deletar usuário
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    const token = Cookies.get('auth_token');
    try {
      await fetch(`http://localhost:3001/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      router.refresh();
      handleCloseModals();
    } catch (error) {
      alert('Ocorreu um erro ao deletar o usuário.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Paginação
  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);
  const currentPage = Number(searchParams.get('page')) || 1;

  return (
    <>
      {/* Modais */}
      {isFormModalOpen && <UserFormModal onClose={handleCloseModals} />}
      {isDeleteModalOpen && deletingUser && (
        <DeleteConfirmationModal
          itemName={deletingUser.name}
          onConfirm={handleDeleteConfirm}
          onClose={handleCloseModals}
          isDeleting={isDeleting}
        />
      )}
      {isChangePasswordModalOpen && changingPasswordForUser && (
        <ChangePasswordModal
          onClose={handleCloseModals}
          userId={changingPasswordForUser.id}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
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

        {/* Campo de Busca */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4 mb-4">
          <div className="relative flex-grow">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {/* Tabela de Usuários */}
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
                      <button
                        onClick={() => handleOpenChangePasswordModal(user)}
                        className="text-gray-400 hover:text-blue-600"
                        title="Alterar senha"
                      >
                        <KeyRound size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="text-gray-400 hover:text-red-600"
                        title="Excluir usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {initialUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </>
  );
}
