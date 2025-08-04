import { Sidebar } from '@/components/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
