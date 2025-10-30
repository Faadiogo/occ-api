-- ============================================
-- MIGRAÇÃO COMPLETA UNIFICADA - OCC API V2
-- ============================================
-- Migration única que contempla toda a estrutura do banco de dados
-- Inclui: Administradores, Clientes, Empresas, Blog, Analytics, Relatórios Tributários

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
-- 3. DOMÍNIO: TIPOS DE ATIVIDADE
-- ============================================

-- Tabela de tipos de atividade
CREATE TABLE IF NOT EXISTS tipo_atividade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  presuncao_irpj DECIMAL(5,2) NOT NULL CHECK (presuncao_irpj >= 0 AND presuncao_irpj <= 100),
  presuncao_csll DECIMAL(5,2) NOT NULL CHECK (presuncao_csll >= 0 AND presuncao_csll <= 100),
  ativo BOOLEAN DEFAULT TRUE,
  -- Campos para presunção variável
  presuncao_irpj_variavel BOOLEAN DEFAULT FALSE,
  faturamento_limite DECIMAL(15,2),
  presuncao_irpj_ate_limite DECIMAL(5,2) CHECK (presuncao_irpj_ate_limite >= 0 AND presuncao_irpj_ate_limite <= 100),
  presuncao_irpj_acima_limite DECIMAL(5,2) CHECK (presuncao_irpj_acima_limite >= 0 AND presuncao_irpj_acima_limite <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tipos de atividade
CREATE INDEX IF NOT EXISTS idx_tipo_atividade_nome ON tipo_atividade(nome);
CREATE INDEX IF NOT EXISTS idx_tipo_atividade_ativo ON tipo_atividade(ativo);

-- ============================================
-- 4. DOMÍNIO: EMPRESAS DOS CLIENTES
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
  cnae VARCHAR(10),
  cnaes_secundarios JSONB DEFAULT '[]'::jsonb,
  tipo_atividade_id UUID REFERENCES tipo_atividade(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_client_companies_client_id ON client_companies(client_id);
CREATE INDEX IF NOT EXISTS idx_client_companies_cnpj ON client_companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_client_companies_cnae ON client_companies(cnae);
CREATE INDEX IF NOT EXISTS idx_client_companies_tipo_atividade_id ON client_companies(tipo_atividade_id);

-- ============================================
-- 5. DOMÍNIO: BLOG
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
-- 6. DOMÍNIO: BLOG ANALYTICS
-- ============================================

-- Tabela de Analytics Agregados
CREATE TABLE IF NOT EXISTS blog_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Métricas de Visualização
  views INTEGER DEFAULT 0 CHECK (views >= 0),
  unique_views INTEGER DEFAULT 0 CHECK (unique_views >= 0),
  shares INTEGER DEFAULT 0 CHECK (shares >= 0),
  
  -- Métricas de Engajamento
  avg_time_on_page INTEGER DEFAULT 0 CHECK (avg_time_on_page >= 0), -- em segundos
  scroll_depth DECIMAL(5,2) DEFAULT 0 CHECK (scroll_depth >= 0 AND scroll_depth <= 100), -- porcentagem
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir um único registro por post
  CONSTRAINT unique_analytics_per_post UNIQUE (post_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_blog_analytics_post_id ON blog_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_views ON blog_analytics(views DESC);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_shares ON blog_analytics(shares DESC);

-- Tabela de Histórico de Visualizações
CREATE TABLE IF NOT EXISTS blog_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Identificação Anônima do Visitante
  session_id VARCHAR(255),
  ip_hash VARCHAR(255), -- Hash SHA-256 do IP para privacidade
  user_agent TEXT,
  
  -- Geolocalização (opcional - pode ser implementado posteriormente)
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Métricas da Visita Individual
  time_on_page INTEGER CHECK (time_on_page >= 0), -- em segundos
  scroll_depth DECIMAL(5,2) CHECK (scroll_depth >= 0 AND scroll_depth <= 100), -- porcentagem
  referrer TEXT, -- URL de origem
  
  -- Timestamp
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_blog_views_post_id ON blog_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_session ON blog_views(session_id);
CREATE INDEX IF NOT EXISTS idx_blog_views_date ON blog_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_views_post_date ON blog_views(post_id, viewed_at DESC);

-- Tabela de Compartilhamentos
CREATE TABLE IF NOT EXISTS blog_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Tipo de Compartilhamento
  platform VARCHAR(50) NOT NULL CHECK (platform IN (
    'facebook', 
    'twitter', 
    'linkedin', 
    'whatsapp', 
    'telegram',
    'email',
    'copy_link',
    'other'
  )),
  
  -- Identificação (opcional)
  session_id VARCHAR(255),
  
  -- Timestamp
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para análise
CREATE INDEX IF NOT EXISTS idx_blog_shares_post_id ON blog_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_shares_platform ON blog_shares(platform);
CREATE INDEX IF NOT EXISTS idx_blog_shares_date ON blog_shares(shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_shares_post_platform ON blog_shares(post_id, platform);

-- ============================================
-- 7. DOMÍNIO: DOCUMENTOS (REMOVIDO)
-- ============================================
-- Tabela documents removida conforme solicitado

-- ============================================
-- 8. DOMÍNIO: PESQUISAS DE SATISFAÇÃO
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
-- 9. DOMÍNIO: PLANEJAMENTO TRIBUTÁRIO (REMOVIDO)
-- ============================================
-- Tabelas tax_plans, revenues e expenses removidas conforme solicitado
-- Apenas tax_calculation_reports será mantida para relatórios de cálculo

-- ============================================
-- 9. DOMÍNIO: RELATÓRIOS DE CÁLCULO TRIBUTÁRIO
-- ============================================

-- Tabela de relatórios de cálculo tributário
CREATE TABLE IF NOT EXISTS tax_calculation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  
  -- Dados mensais - Ano anterior
  jan_anterior DECIMAL(15,2) DEFAULT 0 CHECK (jan_anterior >= 0),
  fev_anterior DECIMAL(15,2) DEFAULT 0 CHECK (fev_anterior >= 0),
  mar_anterior DECIMAL(15,2) DEFAULT 0 CHECK (mar_anterior >= 0),
  abr_anterior DECIMAL(15,2) DEFAULT 0 CHECK (abr_anterior >= 0),
  mai_anterior DECIMAL(15,2) DEFAULT 0 CHECK (mai_anterior >= 0),
  jun_anterior DECIMAL(15,2) DEFAULT 0 CHECK (jun_anterior >= 0),
  jul_anterior DECIMAL(15,2) DEFAULT 0 CHECK (jul_anterior >= 0),
  ago_anterior DECIMAL(15,2) DEFAULT 0 CHECK (ago_anterior >= 0),
  set_anterior DECIMAL(15,2) DEFAULT 0 CHECK (set_anterior >= 0),
  out_anterior DECIMAL(15,2) DEFAULT 0 CHECK (out_anterior >= 0),
  nov_anterior DECIMAL(15,2) DEFAULT 0 CHECK (nov_anterior >= 0),
  dez_anterior DECIMAL(15,2) DEFAULT 0 CHECK (dez_anterior >= 0),
  
  -- Dados mensais - Ano atual
  jan_atual DECIMAL(15,2) DEFAULT 0 CHECK (jan_atual >= 0),
  fev_atual DECIMAL(15,2) DEFAULT 0 CHECK (fev_atual >= 0),
  mar_atual DECIMAL(15,2) DEFAULT 0 CHECK (mar_atual >= 0),
  abr_atual DECIMAL(15,2) DEFAULT 0 CHECK (abr_atual >= 0),
  mai_atual DECIMAL(15,2) DEFAULT 0 CHECK (mai_atual >= 0),
  jun_atual DECIMAL(15,2) DEFAULT 0 CHECK (jun_atual >= 0),
  jul_atual DECIMAL(15,2) DEFAULT 0 CHECK (jul_atual >= 0),
  ago_atual DECIMAL(15,2) DEFAULT 0 CHECK (ago_atual >= 0),
  set_atual DECIMAL(15,2) DEFAULT 0 CHECK (set_atual >= 0),
  out_atual DECIMAL(15,2) DEFAULT 0 CHECK (out_atual >= 0),
  nov_atual DECIMAL(15,2) DEFAULT 0 CHECK (nov_atual >= 0),
  dez_atual DECIMAL(15,2) DEFAULT 0 CHECK (dez_atual >= 0),
  
  -- Dados específicos para cálculo
  tipo_atividade VARCHAR(255),
  folha_pagamento_12m DECIMAL(15,2) DEFAULT 0 CHECK (folha_pagamento_12m >= 0),
  lucro_liquido_anual DECIMAL(15,2) DEFAULT 0 CHECK (lucro_liquido_anual >= 0),
  aliquota_iss DECIMAL(5,2) DEFAULT 0 CHECK (aliquota_iss >= 0 AND aliquota_iss <= 100),
  aliquota_icms DECIMAL(5,2) DEFAULT 0 CHECK (aliquota_icms >= 0 AND aliquota_icms <= 100),
  creditos_pis_cofins DECIMAL(15,2) DEFAULT 0 CHECK (creditos_pis_cofins >= 0),
  
  -- Totais calculados
  rbaa DECIMAL(15,2) DEFAULT 0 CHECK (rbaa >= 0), -- Receita Bruta Anual Anterior
  rba DECIMAL(15,2) DEFAULT 0 CHECK (rba >= 0), -- Receita Bruta Anual
  
  -- Resultados dos cálculos
  best_regime VARCHAR(50),
  economia_melhor_regime DECIMAL(15,2) DEFAULT 0,
  calculation_data JSONB,
  simples_nacional_result JSONB,
  lucro_presumido_result JSONB,
  lucro_real_result JSONB,
  faturamento_mensal JSONB,
  evolucao_mensal JSONB,
  
  -- Auditoria
  created_by UUID NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_tax_calculation_reports_company_id ON tax_calculation_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_reports_created_at ON tax_calculation_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_reports_tipo_atividade ON tax_calculation_reports(tipo_atividade);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_reports_rbaa ON tax_calculation_reports(rbaa);
CREATE INDEX IF NOT EXISTS idx_tax_calculation_reports_rba ON tax_calculation_reports(rba);

-- ============================================
-- 10. TRIGGERS PARA UPDATED_AT
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

-- Trigger para tax_plans removido (tabela removida)

CREATE TRIGGER update_tipo_atividade_updated_at
  BEFORE UPDATE ON tipo_atividade
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para analytics
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analytics_timestamp
  BEFORE UPDATE ON blog_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

-- ============================================
-- 11. FUNÇÕES AUXILIARES
-- ============================================

-- Função para Limpar Dados Antigos (LGPD/GDPR)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove visualizações antigas
  DELETE FROM blog_views 
  WHERE viewed_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Remove compartilhamentos antigos
  DELETE FROM blog_shares 
  WHERE shared_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. VIEWS ÚTEIS
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

-- View para estatísticas de Plan. Tributário (REMOVIDA)
-- View tax_plan_summary removida pois as tabelas tax_plans, revenues e expenses foram removidas

-- View para estatísticas do blog
CREATE OR REPLACE VIEW blog_stats AS
SELECT 
  p.id,
  p.title,
  p.slug,
  p.published,
  COALESCE(ba.views, 0) as views,
  COALESCE(ba.unique_views, 0) as unique_views,
  COALESCE(ba.shares, 0) as shares,
  COALESCE(ba.avg_time_on_page, 0) as avg_time_on_page,
  COALESCE(ba.scroll_depth, 0) as scroll_depth,
  
  -- Cálculo de taxa de engajamento (views únicos / total views * 100)
  CASE 
    WHEN COALESCE(ba.views, 0) > 0 
    THEN ROUND((COALESCE(ba.unique_views, 0)::DECIMAL / ba.views) * 100, 2)
    ELSE 0 
  END as engagement_rate,
  
  -- Cálculo de taxa de compartilhamento (shares / views * 100)
  CASE 
    WHEN COALESCE(ba.views, 0) > 0 
    THEN ROUND((COALESCE(ba.shares, 0)::DECIMAL / ba.views) * 100, 2)
    ELSE 0 
  END as share_rate,
  
  ba.created_at as analytics_created_at,
  ba.updated_at as analytics_updated_at
FROM posts p
LEFT JOIN blog_analytics ba ON p.id = ba.post_id
WHERE p.published = true
ORDER BY ba.views DESC NULLS LAST;

-- View para detalhes completos das empresas
CREATE OR REPLACE VIEW company_details AS
SELECT 
  cc.id,
  cc.client_id,
  cc.company_name,
  cc.cnpj,
  cc.regime_tributario,
  cc.cnae,
  cc.cnaes_secundarios,
  cc.tipo_atividade_id,
  ta.nome as tipo_atividade_nome,
  ta.descricao as tipo_atividade_descricao,
  ta.presuncao_irpj,
  ta.presuncao_csll,
  cc.created_at,
  cc.updated_at,
  cl.name as client_name,
  cl.email as client_email
FROM client_companies cc
LEFT JOIN tipo_atividade ta ON cc.tipo_atividade_id = ta.id
LEFT JOIN clients cl ON cc.client_id = cl.id;

-- ============================================
-- 13. DADOS INICIAIS
-- ============================================

-- Criar superusuário inicial (senha: superadmin123)
INSERT INTO admins (name, email, password_hash, role) VALUES (
  'Super Admin OCC',
  'superadmin@occ.com.br',
  '$2b$10$rZ8qNqJQGQxPZZz9w5hQj.KqJFqYZqZ0qJQGQxPZZz9w5hQj.KqJF',
  'SUPER_ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- Criar categorias de exemplo
INSERT INTO categories (name, slug) VALUES
  ('Tributário', 'tributario'),
  ('Trabalhista', 'trabalhista'),
  ('Empresarial', 'empresarial'),
  ('Notícias', 'noticias')
ON CONFLICT (slug) DO NOTHING;

-- Inserir dados iniciais de tipos de atividade (baseados na legislação tributária)
INSERT INTO tipo_atividade (nome, descricao, presuncao_irpj, presuncao_csll) VALUES
  ('Revenda de Combustíveis e Gás Natural', 'Atividades de revenda de combustíveis e gás natural', 1.60, 12.00),
  ('Comércio e Indústria (Regra Geral)', 'Atividades de comércio e indústria em geral', 8.00, 12.00),
  ('Atividades Imobiliárias (Venda, Loteamento, Construção)', 'Atividades imobiliárias incluindo venda, loteamento e construção', 8.00, 12.00),
  ('Serviços Hospitalares', 'Serviços de saúde e medicina hospitalar', 8.00, 12.00),
  ('Transporte de Cargas', 'Serviços de transporte de cargas', 8.00, 12.00),
  ('Transporte (Exceto Cargas - Passageiros)', 'Serviços de transporte de passageiros', 16.00, 12.00),
  ('Serviços em Geral', 'Prestação de serviços em geral (presunção variável conforme faturamento)', 16.00, 32.00),
  ('Serviços Profissionais Regulamentados (Advogados, Contadores, Engenheiros, Consultores, etc.)', 'Serviços profissionais regulamentados por conselhos', 32.00, 32.00),
  ('Intermediação de Negócios (Corretagem)', 'Atividades de intermediação e corretagem', 32.00, 32.00),
  ('Administração, Locação ou Cessão de Bens/Direitos', 'Administração, locação ou cessão de bens e direitos', 32.00, 32.00),
  ('Operações de Crédito (ESC)', 'Operações de crédito e serviços financeiros', 38.40, 38.40)
ON CONFLICT DO NOTHING;

-- Configurar presunção variável para "Serviços em Geral"
UPDATE tipo_atividade 
SET presuncao_irpj_variavel = TRUE,
    faturamento_limite = 120000.00,
    presuncao_irpj_ate_limite = 16.00,
    presuncao_irpj_acima_limite = 32.00
WHERE nome = 'Serviços em Geral';

-- ============================================
-- 14. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

-- Comentários nas tabelas principais
COMMENT ON TABLE admins IS 'Administradores do sistema OCC com sistema de roles';
COMMENT ON TABLE clients IS 'Clientes do sistema OCC';
COMMENT ON TABLE client_companies IS 'Empresas dos clientes OCC com dados normalizados';
COMMENT ON TABLE tipo_atividade IS 'Tipos de atividade empresarial com presunções de IRPJ e CSLL';
COMMENT ON TABLE categories IS 'Categorias do blog OCC';
COMMENT ON TABLE posts IS 'Posts do blog OCC';
COMMENT ON TABLE surveys IS 'Pesquisas de satisfação OCC';
COMMENT ON TABLE tax_calculation_reports IS 'Relatórios de dados tributários com faturamento mensal normalizado';
COMMENT ON TABLE blog_analytics IS 'Armazena métricas agregadas de analytics para cada post do blog';
COMMENT ON TABLE blog_views IS 'Histórico detalhado de visualizações individuais de posts (dados anonimizados)';
COMMENT ON TABLE blog_shares IS 'Registro de compartilhamentos de posts em diferentes plataformas';

-- Comentários nas colunas específicas
COMMENT ON COLUMN client_companies.cnae IS 'Código CNAE da empresa do cliente';
COMMENT ON COLUMN client_companies.cnaes_secundarios IS 'Array JSON com os CNAEs secundários da empresa';
COMMENT ON COLUMN client_companies.tipo_atividade_id IS 'Referência ao tipo de atividade da empresa';
COMMENT ON COLUMN tipo_atividade.presuncao_irpj IS 'Percentual de presunção de lucro para IRPJ (valor fixo)';
COMMENT ON COLUMN tipo_atividade.presuncao_csll IS 'Percentual de presunção de lucro para CSLL';
COMMENT ON COLUMN tipo_atividade.presuncao_irpj_variavel IS 'Indica se a presunção de IRPJ varia conforme faturamento';
COMMENT ON COLUMN tipo_atividade.faturamento_limite IS 'Limite de faturamento para aplicação da presunção menor';
COMMENT ON COLUMN tipo_atividade.presuncao_irpj_ate_limite IS 'Presunção de IRPJ aplicada até o limite de faturamento';
COMMENT ON COLUMN tipo_atividade.presuncao_irpj_acima_limite IS 'Presunção de IRPJ aplicada acima do limite de faturamento';
COMMENT ON COLUMN tax_calculation_reports.company_id IS 'Referência à empresa do cliente';
COMMENT ON COLUMN tax_calculation_reports.tipo_atividade IS 'Tipo de atividade da empresa';
COMMENT ON COLUMN tax_calculation_reports.folha_pagamento_12m IS 'Folha de pagamento dos últimos 12 meses';
COMMENT ON COLUMN tax_calculation_reports.lucro_liquido_anual IS 'Lucro líquido anual da empresa';
COMMENT ON COLUMN tax_calculation_reports.aliquota_iss IS 'Alíquota de ISS (0-100%)';
COMMENT ON COLUMN tax_calculation_reports.aliquota_icms IS 'Alíquota de ICMS (0-100%)';
COMMENT ON COLUMN tax_calculation_reports.creditos_pis_cofins IS 'Créditos de PIS/COFINS';
COMMENT ON COLUMN tax_calculation_reports.rbaa IS 'Receita Bruta Anual Anterior (soma dos meses anteriores)';
COMMENT ON COLUMN tax_calculation_reports.rba IS 'Receita Bruta Anual (soma dos meses atuais)';

-- Comentários nas colunas mensais - Ano anterior
COMMENT ON COLUMN tax_calculation_reports.jan_anterior IS 'Faturamento de janeiro do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.fev_anterior IS 'Faturamento de fevereiro do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.mar_anterior IS 'Faturamento de março do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.abr_anterior IS 'Faturamento de abril do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.mai_anterior IS 'Faturamento de maio do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.jun_anterior IS 'Faturamento de junho do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.jul_anterior IS 'Faturamento de julho do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.ago_anterior IS 'Faturamento de agosto do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.set_anterior IS 'Faturamento de setembro do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.out_anterior IS 'Faturamento de outubro do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.nov_anterior IS 'Faturamento de novembro do ano anterior';
COMMENT ON COLUMN tax_calculation_reports.dez_anterior IS 'Faturamento de dezembro do ano anterior';

-- Comentários nas colunas mensais - Ano atual
COMMENT ON COLUMN tax_calculation_reports.jan_atual IS 'Faturamento de janeiro do ano atual';
COMMENT ON COLUMN tax_calculation_reports.fev_atual IS 'Faturamento de fevereiro do ano atual';
COMMENT ON COLUMN tax_calculation_reports.mar_atual IS 'Faturamento de março do ano atual';
COMMENT ON COLUMN tax_calculation_reports.abr_atual IS 'Faturamento de abril do ano atual';
COMMENT ON COLUMN tax_calculation_reports.mai_atual IS 'Faturamento de maio do ano atual';
COMMENT ON COLUMN tax_calculation_reports.jun_atual IS 'Faturamento de junho do ano atual';
COMMENT ON COLUMN tax_calculation_reports.jul_atual IS 'Faturamento de julho do ano atual';
COMMENT ON COLUMN tax_calculation_reports.ago_atual IS 'Faturamento de agosto do ano atual';
COMMENT ON COLUMN tax_calculation_reports.set_atual IS 'Faturamento de setembro do ano atual';
COMMENT ON COLUMN tax_calculation_reports.out_atual IS 'Faturamento de outubro do ano atual';
COMMENT ON COLUMN tax_calculation_reports.nov_atual IS 'Faturamento de novembro do ano atual';
COMMENT ON COLUMN tax_calculation_reports.dez_atual IS 'Faturamento de dezembro do ano atual';

-- Comentários nas views
COMMENT ON VIEW posts_with_details IS 'View consolidada com informações completas de posts';
COMMENT ON VIEW blog_stats IS 'View consolidada com estatísticas calculadas de posts';
COMMENT ON VIEW company_details IS 'View consolidada com informações completas das empresas incluindo tipo de atividade';

-- Comentário sobre o uso da função de limpeza
COMMENT ON FUNCTION cleanup_old_analytics_data IS 
'Remove dados de analytics mais antigos que o período especificado (padrão: 365 dias). 
Execute periodicamente via cron job para compliance com LGPD/GDPR.
Exemplo de uso: SELECT cleanup_old_analytics_data(365);';

-- ============================================
-- FIM DA MIGRAÇÃO UNIFICADA
-- ============================================
