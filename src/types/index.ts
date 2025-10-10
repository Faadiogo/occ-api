// Tipos e interfaces do sistema

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export enum RegimeTributario {
  SIMPLES_NACIONAL = 'Simples Nacional',
  LUCRO_PRESUMIDO = 'Lucro Presumido',
  LUCRO_REAL = 'Lucro Real'
}

export enum QuestionType {
  ALTERNATIVA = 'ALTERNATIVA',
  DISSERTATIVA = 'DISSERTATIVA',
  RATING = 'RATING'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: UserRole;
  description?: string;
}

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  cnpj: string;
  regime_tributario: RegimeTributario;
  created_at: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string;
  author_id: string;
  category_id: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  created_by: string;
  is_active: boolean;
  created_at: Date;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  type: QuestionType;
  options?: string[];
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  client_id: string;
  submitted_at: Date;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string;
  created_at: Date;
}

export interface TaxPlan {
  id: string;
  client_id: string;
  year: number;
  created_at: Date;
  updated_at: Date;
}

export interface Revenue {
  id: string;
  tax_plan_id: string;
  description: string;
  amount: number;
  date: Date;
  created_at: Date;
}

export interface Expense {
  id: string;
  tax_plan_id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  created_at: Date;
}

export interface Document {
  id: string;
  client_id: string;
  title: string;
  file_url: string;
  uploaded_at: Date;
  uploaded_by: string;
}

// Request types com user autenticado
export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

