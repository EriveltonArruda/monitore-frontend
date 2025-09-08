export type Municipality = { id: number; name: string; cnpj?: string | null };
export type Department = { id: number; name: string; municipalityId: number };

export type Contract = {
  id: number;
  code: string;
  description: string | null;
  municipalityId: number;
  departmentId: number | null;
  startDate: string | null;
  endDate: string | null;
  monthlyValue: number | null;
  status: string; // "ATIVO" | ...
  signedAt: string | null;
  processNumber: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;

  municipality?: Municipality;
  department?: Department | null;

  // enriquecidos pelo service
  daysToEnd?: number | null;
  alertTag?: 'EXPIRADO' | 'D-7' | 'D-30' | 'HOJE' | null;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
