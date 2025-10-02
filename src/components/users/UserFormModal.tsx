"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/User";
import { UserModule } from "@/types/UserModule";

// ===== ROLES =====
const USER_ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Gerente" },
  { value: "USER", label: "Usuário" },
];

// ===== GRUPOS DE MÓDULOS =====
const MODULE_GROUPS: Array<{
  label: string;
  items: Array<{ value: UserModule; label: string }>;
}> = [
    {
      label: "Estoque",
      items: [
        { value: UserModule.ESTOQUE, label: "Estoque" },
        { value: UserModule.MOVIMENTACOES, label: "Movimentações" },
        { value: UserModule.CATEGORIAS, label: "Categorias" },
        { value: UserModule.FORNECEDORES, label: "Fornecedores" },
      ],
    },
    {
      label: "Financeiro",
      items: [
        { value: UserModule.CONTAS_PAGAR, label: "Contas a Pagar" },
        { value: UserModule.RELATORIO_CONTAS_PAGAR, label: "Relatórios de Contas" },
        { value: UserModule.DESPESAS_VIAGEM, label: "Despesas de Viagem" },
        { value: UserModule.RECEBIVEIS, label: "Recebíveis" },
      ],
    },
    {
      label: "Prefeituras",
      items: [
        { value: UserModule.MUNICIPIOS, label: "Municípios" },
        { value: UserModule.ORGAOS_SECRETARIAS, label: "Órgãos/Secretarias" },
        { value: UserModule.CONTRATOS, label: "Contratos" },
      ],
    },
    {
      label: "Geral",
      items: [
        { value: UserModule.RELATORIOS, label: "Relatórios (geral)" },
        { value: UserModule.CONTATOS, label: "Contatos" },
        { value: UserModule.DASHBOARD, label: "Dashboard" },
        { value: UserModule.USUARIOS, label: "Usuários" },
      ],
    },
  ];

// ===== SANITIZAÇÃO/VALIDAÇÃO =====
const ALL_MODULES = Object.values(UserModule);

function sanitizeModules(input: any): UserModule[] {
  if (!Array.isArray(input)) return [];
  // normaliza, mapeia legado, trim, filtra vazios e inválidos, deduplica
  const normalized = input
    .map((m) => (m === "ORGAOS" ? "ORGAOS_SECRETARIAS" : m))
    .map((m) => (m == null ? "" : String(m).trim()))
    .filter((m) => m.length > 0)
    .filter((m): m is UserModule => ALL_MODULES.includes(m as UserModule));

  return Array.from(new Set(normalized));
}

function validateModules(mods: any): { valid: UserModule[]; invalid: string[] } {
  const arr = Array.isArray(mods) ? mods : [];
  const cleaned = arr.map((m) => (m == null ? "" : String(m).trim()));
  const invalid = cleaned.filter((m) => !ALL_MODULES.includes(m as UserModule));
  const valid = cleaned.filter((m): m is UserModule => ALL_MODULES.includes(m as UserModule));
  return { valid: Array.from(new Set(valid)), invalid: Array.from(new Set(invalid)) };
}

// ===== TOKEN/AUTH HELPERS =====
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "auth_token" && value && !isTokenExpired(value)) return value;
    }
    const localToken = localStorage.getItem("auth_token");
    if (localToken && !isTokenExpired(localToken)) return localToken;
    const sessionToken = sessionStorage.getItem("auth_token");
    if (sessionToken && !isTokenExpired(sessionToken)) return sessionToken;
  }
  return null;
};

const createAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

type UserFormModalProps = {
  onClose: () => void;
  user?: User; // edição se vier
};

export function UserFormModal({ onClose, user }: UserFormModalProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    modules: UserModule[];
  }>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "USER",
    modules: sanitizeModules(user?.modules ?? []),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        modules: sanitizeModules(user.modules ?? []),
      });
    }
  }, [user]);

  // ===== HANDLERS BÁSICOS =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const id = target.id;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      return; // os checkboxes de módulos usam as funções abaixo
    }
    setFormData((prev) => ({ ...prev, [id]: target.value }));
  };

  // ===== SELEÇÃO DE MÓDULOS =====
  const allValues: UserModule[] = useMemo(
    () => MODULE_GROUPS.flatMap((g) => g.items.map((i) => i.value)),
    []
  );

  const toggleModule = (m: UserModule) => {
    setFormData((prev) => {
      const set = new Set(prev.modules);
      if (set.has(m)) set.delete(m);
      else set.add(m);
      return { ...prev, modules: Array.from(set) };
    });
  };

  const selectAllGroup = (groupValues: UserModule[], checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.modules);
      if (checked) groupValues.forEach((v) => set.add(v));
      else groupValues.forEach((v) => set.delete(v));
      return { ...prev, modules: Array.from(set) };
    });
  };

  const allChecked = allValues.every((v) => formData.modules.includes(v));
  const someChecked = !allChecked && allValues.some((v) => formData.modules.includes(v));

  const selectAll = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, modules: checked ? allValues : [] }));
  };

  // ===== SUBMIT =====
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // valida localmente antes de enviar
      const { valid, invalid } = validateModules(formData.modules);
      if (invalid.length > 0) {
        setError(
          `Módulos inválidos: ${invalid.join(
            ", "
          )}. Verifique os selecionados e tente novamente.`
        );
        setIsSubmitting(false);
        return;
      }

      const payloadModules = sanitizeModules(valid);
      const bodyBase = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        modules: payloadModules,
      };

      // debug útil: veja no Console o payload que está indo
      console.log("[UserFormModal] Enviando módulos:", payloadModules);

      let response: Response;
      if (user) {
        const headers = createAuthHeaders();
        response = await fetch(`http://localhost:3001/users/${user.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(bodyBase),
        });
      } else {
        response = await fetch("http://localhost:3001/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bodyBase,
            password: formData.password,
          }),
        });
      }

      if (!response.ok) {
        const text = await response.text();
        let message = text;
        try {
          const data = JSON.parse(text);
          message = data?.message || message;
        } catch {
          // mantém text cru
        }
        if (response.status === 401) {
          throw new Error("Não autorizado. Faça login novamente.");
        }
        throw new Error(message || `Falha ao salvar usuário (${response.status}).`);
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{user ? "Editar Usuário" : "Novo Usuário"}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!user || isSubmitting}
              className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Senha (apenas criação) */}
          {!user && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha *
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={isSubmitting}
                className="w-full border-gray-300 rounded-md p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
            </div>
          )}

          {/* Função */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Função *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full border-gray-300 rounded-md p-2 border bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Módulos */}
          <fieldset disabled={isSubmitting}>
            <legend className="text-sm font-medium mb-2">Módulos de Acesso</legend>

            {/* Selecionar todos */}
            <div className="flex items-center justify-between mb-2">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => {
                    if (el) el.indeterminate = someChecked;
                  }}
                  onChange={(e) => selectAll(e.target.checked)}
                />
                Selecionar todos
              </label>
            </div>

            <div className="space-y-4 border border-gray-200 rounded-md p-3 max-h-64 overflow-y-auto">
              {MODULE_GROUPS.map((g) => {
                const groupValues = g.items.map((i) => i.value) as UserModule[];
                const groupAll = groupValues.every((v) => formData.modules.includes(v));
                const groupSome =
                  !groupAll && groupValues.some((v) => formData.modules.includes(v));

                return (
                  <div key={g.label} className="border-b last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        {g.label}
                      </span>
                      <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={groupAll}
                          ref={(el) => {
                            if (el) el.indeterminate = groupSome;
                          }}
                          onChange={(e) => selectAllGroup(groupValues, e.target.checked)}
                        />
                        Selecionar grupo
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {g.items.map((i) => (
                        <label
                          key={i.value}
                          className="inline-flex items-center gap-2 text-sm text-gray-700"
                        >
                          <input
                            type="checkbox"
                            checked={formData.modules.includes(i.value)}
                            onChange={() => toggleModule(i.value)}
                          />
                          {i.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Selecione os módulos que o usuário terá acesso.
            </p>
          </fieldset>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-4 pt-4 border-t mt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? user
                  ? "Salvando..."
                  : "Criando..."
                : user
                  ? "Salvar Alterações"
                  : "Criar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
