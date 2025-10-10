-- ============================================
-- MIGRAÇÃO COMPLETA - OCC API V2 COM SUPERUSUÁRIO
-- ============================================
-- Execute este script para criar a estrutura completa do zero

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. DOMÍNIO: ADMINISTRADORES
-- ============================================

-- Tabela de administradores (com sistema de roles)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para administradores
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- ============================================
-- 2. DOMÍNIO: CLIENTES (USUÁRIOS)
-- ============================================

-- Tabela de clientes (usuários com login)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_by UUID NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- ============================================
-- 3. DOMÍNIO: EMPRESAS DOS CLIENTES
-- ============================================

-- Tabela de empresas dos clientes
CREATE TABLE IF NOT EXISTS client_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  regime_tributario VARCHAR(50) NOT NULL CHECK (
    regime_tributario IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_client_companies_client_id ON client_companies(client_id);
CREATE INDEX IF NOT EXISTS idx_client_companies_cnpj ON client_companies(cnpj);

-- ============================================
-- 4. DOMÍNIO: BLOG
-- ============================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL
);

-- Índice para categorias
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Tabela de posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  cover_image VARCHAR(500),
  author_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para posts
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================
-- 5. DOMÍNIO: DOCUMENTOS
-- ============================================

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES admins(id) ON DELETE SET NULL
);

-- Índices para documentos
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);

-- ============================================
-- 6. DOMÍNIO: PESQUISAS DE SATISFAÇÃO
-- ============================================

-- Tabela de pesquisas
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para pesquisas
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);

-- Tabela de perguntas da pesquisa
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (
    type IN ('ALTERNATIVA', 'DISSERTATIVA', 'RATING')
  ),
  options JSONB,
  "order" INTEGER NOT NULL
);

-- Índices para perguntas
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order ON survey_questions("order");

-- Tabela de respostas da pesquisa
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para respostas
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_client_id ON survey_responses(client_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at DESC);

-- Tabela de respostas individuais
CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para respostas individuais
CREATE INDEX IF NOT EXISTS idx_survey_answers_response_id ON survey_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_question_id ON survey_answers(question_id);

-- ============================================
-- 7. DOMÍNIO: Plan. Tributário
-- ============================================

-- Tabela de Plan. Tributário
CREATE TABLE IF NOT EXISTS tax_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year)
);

-- Índices para Plan. Tributário
CREATE INDEX IF NOT EXISTS idx_tax_plans_client_id ON tax_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_tax_plans_year ON tax_plans(year);

-- Tabela de receitas
CREATE TABLE IF NOT EXISTS revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_plan_id UUID NOT NULL REFERENCES tax_plans(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para receitas
CREATE INDEX IF NOT EXISTS idx_revenues_tax_plan_id ON revenues(tax_plan_id);
CREATE INDEX IF NOT EXISTS idx_revenues_date ON revenues(date DESC);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_plan_id UUID NOT NULL REFERENCES tax_plans(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  date TIMESTAMPTZ NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para despesas
CREATE INDEX IF NOT EXISTS idx_expenses_tax_plan_id ON expenses(tax_plan_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- ============================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_companies_updated_at
  BEFORE UPDATE ON client_companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_plans_updated_at
  BEFORE UPDATE ON tax_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. VIEWS ÚTEIS
-- ============================================

-- View para listar posts com informações completas
CREATE OR REPLACE VIEW posts_with_details AS
SELECT 
  p.*,
  a.name as author_name,
  a.email as author_email,
  c.name as category_name,
  c.slug as category_slug
FROM posts p
LEFT JOIN admins a ON p.author_id = a.id
LEFT JOIN categories c ON p.category_id = c.id;

-- View para estatísticas de Plan. Tributário
CREATE OR REPLACE VIEW tax_plan_summary AS
SELECT 
  tp.id,
  tp.client_id,
  tp.year,
  cl.name as client_name,
  cl.email as client_email,
  cc.company_name,
  COALESCE(SUM(r.amount), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(r.amount), 0) - COALESCE(SUM(e.amount), 0) as net_result
FROM tax_plans tp
LEFT JOIN clients cl ON tp.client_id = cl.id
LEFT JOIN client_companies cc ON cl.id = cc.client_id
LEFT JOIN revenues r ON tp.id = r.tax_plan_id
LEFT JOIN expenses e ON tp.id = e.tax_plan_id
GROUP BY tp.id, tp.client_id, tp.year, cl.name, cl.email, cc.company_name;

-- ============================================
-- 10. DADOS INICIAIS
-- ============================================

-- Criar superusuário inicial (senha: superadmin123)
INSERT INTO admins (name, email, password_hash, role) VALUES (
  'Super Admin OCC',
  'superadmin@occ.com.br',
  '$2b$10$rZ8qNqJQGQxPZZz9w5hQj.KqJFqYZqZ0qJQGQxPZZz9w5hQj.KqJF',
  'SUPER_ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- Criar admin padrão (senha: admin123)
INSERT INTO admins (name, email, password_hash, role) VALUES (
  'Admin OCC',
  'admin@occ.com.br',
  '$2b$10$rZ8qNqJQGQxPZZz9w5hQj.KqJFqYZqZ0qJQGQxPZZz9w5hQj.KqJF',
  'ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- Criar categorias de exemplo
INSERT INTO categories (name, slug) VALUES
  ('Tributário', 'tributario'),
  ('Trabalhista', 'trabalhista'),
  ('Empresarial', 'empresarial'),
  ('Notícias', 'noticias')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

COMMENT ON TABLE admins IS 'Administradores do sistema OCC V2 com sistema de roles';
COMMENT ON TABLE clients IS 'Clientes do sistema OCC V2';
COMMENT ON TABLE client_companies IS 'Empresas dos clientes OCC V2';
COMMENT ON TABLE categories IS 'Categorias do blog OCC V2';
COMMENT ON TABLE posts IS 'Posts do blog OCC V2';
COMMENT ON TABLE documents IS 'Documentos dos clientes OCC V2';
COMMENT ON TABLE surveys IS 'Pesquisas de satisfação OCC V2';
COMMENT ON TABLE tax_plans IS 'Planejamentos tributários OCC V2';
