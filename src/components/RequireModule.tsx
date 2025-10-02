// src/components/RequireModule.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { UserModule } from "@/types/UserModule";

type RequireModuleProps = {
  /** Concede acesso se o usuário possuir ESTE módulo (modo simples – retrocompatível) */
  module?: UserModule;
  /** Concede acesso se o usuário possuir QUALQUER UM desses módulos (modo avançado) */
  anyOf?: UserModule[];
  /** Para onde redirecionar se estiver logado mas sem permissão (default: "/not-authorized") */
  redirectTo?: string;
  /** Para onde redirecionar se não estiver logado (default: "/login") */
  loginPath?: string;
  /** UI enquanto carrega (default: "Carregando…") */
  fallbackWhileLoading?: React.ReactNode;
  /** UI se não tiver acesso e você optar por não redirecionar */
  fallbackNoAccess?: React.ReactNode;
  children: React.ReactNode;
};

export function RequireModule({
  module,
  anyOf,
  redirectTo = "/not-authorized",
  loginPath = "/login",
  fallbackWhileLoading = <div>Carregando...</div>,
  fallbackNoAccess = null,
  children,
}: RequireModuleProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Normaliza os módulos exigidos (suporta module único OU anyOf)
  const required: UserModule[] = useMemo(() => {
    if (Array.isArray(anyOf) && anyOf.length) return anyOf;
    return module ? [module] : [];
  }, [module, anyOf]);

  const hasAccess = useMemo(() => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    const userModules: string[] = Array.isArray((user as any).modules)
      ? (user as any).modules
      : [];
    if (required.length === 0) return true; // se nada for exigido, não bloqueia
    // precisa ter pelo menos 1 módulo exigido
    return required.some((m) => userModules.includes(m));
  }, [user, required]);

  useEffect(() => {
    if (loading) return;

    // não autenticado → login
    if (!user) {
      if (loginPath) router.replace(loginPath);
      return;
    }

    // autenticado mas sem permissão → not authorized
    if (!hasAccess) {
      if (redirectTo) router.replace(redirectTo);
      return;
    }
  }, [loading, user, hasAccess, router, redirectTo, loginPath]);

  if (loading) return <>{fallbackWhileLoading}</>;

  // Se ainda não há usuário (e não redirecionamos por algum motivo), não renderiza a página.
  if (!user) return null;

  // Se não tem acesso (e não redirecionamos por algum motivo), mostra fallback.
  if (!hasAccess) return <>{fallbackNoAccess}</>;

  return <>{children}</>;
}
