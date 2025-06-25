import Link from 'next/link';
import {
  LayoutDashboard,
  Boxes,
  ArrowRightLeft,
  ScrollText,
  UserCircle,
  Power,
} from 'lucide-react';

export function Sidebar() {
  // Simulação de dados do usuário e do sistema
  const user = { name: 'Erivelton', role: 'Administrador' };
  const systemStatus = { online: true, lowStockAlerts: 3 };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">Estoque Monitore</h1>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-grow p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
          Navegação
        </p>
        <ul>
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-3 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Boxes size={20} />
              <span>Produtos</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/categories"
              className="flex items-center gap-3 py-2 px-3 rounded-md font-semibold text-blue-600 bg-blue-50"
            >
              <Boxes size={20} />
              <span>Categorias</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/movements"
              className="flex items-center gap-3 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <ArrowRightLeft size={20} />
              <span>Movimentações</span>
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-3 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <ScrollText size={20} />
              <span>Relatórios</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Status do Sistema e Perfil */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">
          <p className="font-bold">Sistema Online</p>
          <p>Funcionando normalmente</p>
        </div>

        {systemStatus.lowStockAlerts > 0 && (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded-md text-sm mb-4">
            <p className="font-bold">Alertas</p>
            <p>Produtos com estoque baixo</p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <UserCircle size={40} className="text-gray-400" />
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
          <button className="text-gray-400 hover:text-red-500">
            <Power size={20} />
          </button>
        </div>
      </div>
    </aside>
  );
}
