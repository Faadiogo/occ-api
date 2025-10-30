// Tipos específicos para dados do banco de dados
import { UserRole, RegimeTributario } from './index';

// Interfaces para dados retornados do Supabase
export interface TaxPlanWithClient {
  id: string;
  client_id: string;
  year: number;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    company_name: string;
    user_id: string;
  };
}

export interface TaxPlanWithDetails {
  id: string;
  client_id: string;
  year: number;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    company_name: string;
    user_id: string;
    regime_tributario: RegimeTributario;
  };
  revenues: Array<{
    id: string;
    tax_plan_id: string;
    description: string;
    amount: number;
    date: string;
    created_at: string;
  }>;
  expenses: Array<{
    id: string;
    tax_plan_id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    created_at: string;
  }>;
}

export interface ClientWithUser {
  id: string;
  company_name: string;
  cnpj: string;
  regime_tributario: RegimeTributario;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface PostWithAuthor {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  author_id: string;
  category_id: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// Tipos para queries do Supabase
export interface SupabaseQueryParams {
  client_id?: string;
  year?: number;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}
