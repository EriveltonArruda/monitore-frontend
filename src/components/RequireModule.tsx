"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserModule } from "@/types/UserModule";

type RequireModuleProps = {
  module: UserModule;
  children: React.ReactNode;
};

export function RequireModule({ module, children }: RequireModuleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== "ADMIN" && !user.modules.includes(module)) {
      router.replace("/not-authorized"); // Você pode criar uma página de "Sem permissão"
    }
  }, [user, loading, module, router]);

  // Enquanto está carregando, ou se tem acesso, mostra a página normalmente
  if (loading) return <div>Carregando...</div>;
  if (user && (user.role === "ADMIN" || user.modules.includes(module))) {
    return <>{children}</>;
  }

  // Senão, pode mostrar nada, ou um loading
  return null;
}
