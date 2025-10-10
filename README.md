# 🚀 OCC API V2 - Documentação Completa

**Backend completo para gestão de administradores, clientes, blog, pesquisas e Plan. Tributário**

---

## 📑 Índice

1. [Visão Geral](#-visão-geral)
2. [Nova Estrutura V2](#-nova-estrutura-v2)
3. [Estrutura do Projeto](#-estrutura-do-projeto)
4. [Instalação Rápida](#-instalação-rápida-5-minutos)
5. [Funcionalidades](#-funcionalidades)
6. [Endpoints da API](#-endpoints-da-api)
7. [Banco de Dados](#-banco-de-dados)
8. [Exemplos de Uso](#-exemplos-de-uso)
9. [Deploy](#-deploy)
10. [Tecnologias](#-tecnologias)

---

## 🎯 Visão Geral

Sistema completo de backend com **duas camadas de autenticação**: Administradores e Clientes separados, com controle total sobre criação de contas.

### ✨ Principais Recursos

- ✅ **Autenticação dupla** (Admin + Cliente)
- ✅ **Criação de clientes apenas por admins**
- ✅ **Blog completo** com categorias e slugs
- ✅ **Gestão de clientes** com empresas e documentos
- ✅ **Pesquisas de satisfação** (3 tipos de perguntas)
- ✅ **Plan. Tributário** com receitas e despesas
- ✅ **Validação robusta** com Zod
- ✅ **Documentação completa**

---

## 🔄 Nova Estrutura V2

### **Mudanças Principais**

| **Antes (V1)** | **Agora (V2)** | **Descrição** |
|----------------|----------------|---------------|
| `users` (ADMIN/CLIENT) | `admins` | Apenas administradores |
| `clients` (dados empresa) | `clients` | Usuários clientes com login |
| - | `client_companies` | Dados das empresas |
| `/api/auth/register` | `/api/admin/clients` | Criação apenas por admins |

### **Fluxo de Autenticação**

1. **Super Admin faz login** → `/api/admin/login` (superadmin@occ.com.br)
2. **Super Admin cria outros admins** → `/api/admin/admins` (POST)
3. **Admin cria cliente** → `/api/admin/clients` (POST)
4. **Cliente faz login** → `/api/client-auth/login`
5. **Cliente acessa recursos** → Com token próprio

### **Sistema de Roles**

| **Role** | **Permissões** |
|----------|----------------|
| **SUPER_ADMIN** | Criar/gerenciar outros admins + todas as permissões de ADMIN |
| **ADMIN** | Criar/gerenciar clientes + blog + pesquisas + planejamento |
| **CLIENT** | Acessar pesquisas + Plan. Tributário próprio |

---

## 📁 Estrutura do Projeto

```
occ-api/
├── src/
│   ├── config/          # Configurações (Database, Env)
│   ├── controllers/     # Lógica de negócio (6 controllers)
│   ├── middlewares/     # Auth, Errors, Validation
│   ├── routes/          # Definição de rotas
│   ├── schemas/         # Validações Zod
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (JWT, Errors, Response)
│   ├── app.ts           # Express app
│   └── server.ts        # Entry point
├── database/
│   └── schema.sql       # Migrações SQL (14 tabelas)
├── package.json
├── tsconfig.json
└── .env.example
```

---

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Instalar Dependências

```bash
cd occ-api
npm install
```

### 2️⃣ Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) → Crie uma conta gratuita
2. Crie novo projeto (aguarde ~2 min)
3. Vá em **SQL Editor** → **New Query**
4. Copie e execute `database/schema.sql`
5. Em **Settings** → **API**, copie as credenciais

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_KEY=sua-chave-service

JWT_SECRET=mude-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:3001
```

### 4️⃣ Iniciar

```bash
npm run dev
```

Acesse: http://localhost:3001/api/health

---

## 🎨 Funcionalidades

### 1. 🔐 Autenticação (JWT + Bcrypt)

- Registro de usuários
- Login com senha criptografada (bcrypt)
- Refresh token (renovação automática)
- Middleware de autenticação
- Sistema de roles (ADMIN/CLIENT)

### 2. 📝 Blog

- CRUD completo de posts
- CRUD de categorias
- Busca por ID ou slug
- Filtros (publicado, categoria)
- Paginação
- Controle de publicação

### 3. 👥 Gestão de Clientes

- CRUD de clientes
- Validação de CNPJ (14 dígitos)
- Regimes tributários (Simples, Lucro Presumido, Lucro Real)
- Upload de documentos
- Controle de acesso por usuário

### 4. 📊 Pesquisas de Satisfação

- Criar pesquisas com múltiplas perguntas
- 3 tipos de perguntas:
  - **RATING** - Avaliação numérica
  - **ALTERNATIVA** - Múltipla escolha
  - **DISSERTATIVA** - Texto livre
- Respostas de clientes
- Relatórios completos (admin)

### 5. 💰 Plan. Tributário

- Planejamentos por cliente/ano
- Adicionar receitas e despesas
- Cálculos automáticos (via SQL views)
- Categorização de despesas
- Controle granular de acesso

---

## 🔌 Endpoints da API V2

### 🔓 Públicos (sem autenticação)

```
GET  /                          # Info da API
GET  /api/health                # Health check
GET  /api/posts                 # Listar posts
GET  /api/categories            # Listar categorias
```

### 🔐 Autenticação de Administradores

```
POST /api/admin/login           # Login admin
POST /api/admin/refresh         # Renovar token admin
GET  /api/admin/me              # Dados do admin
```

### 🔐 Autenticação de Clientes

```
POST /api/client-auth/login     # Login cliente
POST /api/client-auth/refresh  # Renovar token cliente
GET  /api/client-auth/me       # Dados do cliente
PUT  /api/client-auth/profile  # Atualizar perfil
PUT  /api/client-auth/change-password # Alterar senha
```

### 🔒 Administradores (requer token admin)

**Gestão de Clientes**
```
GET  /api/admin/clients         # Listar clientes
GET  /api/admin/clients/:id     # Ver cliente específico
POST /api/admin/clients         # Criar cliente
PUT  /api/admin/clients/:id     # Atualizar cliente
DELETE /api/admin/clients/:id   # Deletar cliente
```

**Gestão de Administradores (Super Admin)**
```
GET  /api/admin/admins          # Listar administradores
GET  /api/admin/admins/:id      # Ver administrador específico
POST /api/admin/admins          # Criar administrador
PUT  /api/admin/admins/:id      # Atualizar administrador
DELETE /api/admin/admins/:id    # Deletar administrador
```

**Blog (Admin)**
```
POST   /api/posts               # Criar post
PUT    /api/posts/:id           # Atualizar post
DELETE /api/posts/:id           # Deletar post
POST   /api/categories          # Criar categoria
```

**Pesquisas (Admin)**
```
GET  /api/surveys                    # Listar
GET  /api/surveys/:id                # Ver específica
POST /api/surveys                    # Criar
GET  /api/surveys/:id/responses      # Ver respostas
```

**Plan. Tributário (Admin)**
```
GET    /api/tax-plans                    # Listar
GET    /api/tax-plans/:id                # Ver específico
POST   /api/tax-plans                    # Criar
POST   /api/tax-plans/:id/revenues       # Adicionar receita
POST   /api/tax-plans/:id/expenses       # Adicionar despesa
DELETE /api/tax-plans/:id/revenues/:rid  # Deletar receita
DELETE /api/tax-plans/:id/expenses/:eid  # Deletar despesa
```

### 🔒 Clientes (requer token cliente)

**Pesquisas (Cliente)**
```
GET  /api/surveys                    # Listar ativas
GET  /api/surveys/:id                # Ver específica
POST /api/surveys/:id/responses      # Responder
```

**Plan. Tributário (Cliente)**
```
GET    /api/tax-plans                    # Listar próprios
GET    /api/tax-plans/:id                # Ver específico
POST   /api/tax-plans/:id/revenues       # Adicionar receita
POST   /api/tax-plans/:id/expenses       # Adicionar despesa
DELETE /api/tax-plans/:id/revenues/:rid  # Deletar receita
DELETE /api/tax-plans/:id/expenses/:eid  # Deletar despesa
```

---

## 💾 Banco de Dados V2

### 12 Tabelas Criadas

| Domínio | Tabelas |
|---------|---------|
| **Administradores** | `admins` |
| **Clientes** | `clients`, `client_companies` |
| **Blog** | `categories`, `posts` |
| **Documentos** | `documents` |
| **Pesquisas** | `surveys`, `survey_questions`, `survey_responses`, `survey_answers` |
| **Tributário** | `tax_plans`, `revenues`, `expenses` |

### Views SQL

- `posts_with_details` - Posts com autor e categoria
- `tax_plan_summary` - Resumo financeiro (receitas - despesas)

### Recursos Avançados

- ✅ Triggers para `updated_at` automático
- ✅ Índices otimizados para performance
- ✅ Foreign keys com cascata
- ✅ Constraints de validação
- ✅ Preparado para RLS (Row Level Security)

---

## 📝 Exemplos de Uso V2

### 1. Login de Super Administrador

```bash
POST http://localhost:3001/api/admin/login
Content-Type: application/json

{
  "email": "superadmin@occ.com.br",
  "password": "superadmin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Super Admin OCC", "email": "superadmin@occ.com.br", "role": "SUPER_ADMIN" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Criar Administrador (Super Admin)

```bash
POST http://localhost:3001/api/admin/admins
Authorization: Bearer TOKEN_SUPER_ADMIN
Content-Type: application/json

{
  "name": "Admin Principal",
  "email": "admin@occ.com.br",
  "password": "admin123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Admin Principal",
    "email": "admin@occ.com.br",
    "role": "ADMIN",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Criar Cliente (Admin)

```bash
POST http://localhost:3001/api/admin/clients
Authorization: Bearer SEU_TOKEN_ADMIN
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "password": "senha123",
  "company_name": "Empresa XYZ Ltda",
  "cnpj": "12345678901234",
  "regime_tributario": "Simples Nacional"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "...",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "company": {
        "company_name": "Empresa XYZ Ltda",
        "cnpj": "12345678901234",
        "regime_tributario": "Simples Nacional"
      }
    }
  }
}
```

### 4. Login de Cliente

```bash
POST http://localhost:3001/api/client-auth/login
Content-Type: application/json

{
  "email": "joao@empresa.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": { 
      "id": "...", 
      "name": "João Silva", 
      "email": "joao@empresa.com", 
      "role": "CLIENT",
      "company": {
        "company_name": "Empresa XYZ Ltda",
        "cnpj": "12345678901234",
        "regime_tributario": "Simples Nacional"
      }
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Criar Post (Admin)

```bash
POST http://localhost:3001/api/posts
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "title": "Como otimizar impostos",
  "slug": "otimizar-impostos",
  "content": "<p>Conteúdo do post...</p>",
  "cover_image": "https://exemplo.com/imagem.jpg",
  "category_id": "uuid-da-categoria",
  "published": true
}
```

### 4. Criar Pesquisa (Admin)

```bash
POST http://localhost:3001/api/surveys
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json

{
  "title": "Pesquisa de Satisfação 2024",
  "description": "Avalie nossos serviços",
  "questions": [
    {
      "question_text": "Como avalia nosso atendimento?",
      "type": "RATING",
      "order": 1
    },
    {
      "question_text": "Qual serviço mais utiliza?",
      "type": "ALTERNATIVA",
      "options": ["Contabilidade", "Tributário", "Trabalhista"],
      "order": 2
    }
  ]
}
```

### 5. Adicionar Receita ao Planejamento

```bash
POST http://localhost:3001/api/tax-plans/:id/revenues
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "description": "Venda de produtos",
  "amount": 50000.00,
  "date": "2024-01-15T00:00:00Z"
}
```

### 📌 Notas Importantes

- **Autenticação**: Use header `Authorization: Bearer TOKEN`
- **Formato de data**: ISO 8601 (`2024-01-15T12:00:00Z`)
- **Paginação**: `?page=1&limit=10`
- **CNPJ**: Apenas números, 14 dígitos

---

## 🚀 Deploy

### Vercel (Recomendado - Gratuito)

```bash
npm i -g vercel
vercel
```

Configure as variáveis de ambiente no dashboard da Vercel.

### Railway

1. Conecte repositório GitHub
2. Configure variáveis de ambiente
3. Deploy automático

### Docker

```bash
docker build -t occ-api .
docker run -p 3001:3001 --env-file .env occ-api
```

### ⚠️ Checklist Pré-Deploy

- [ ] Banco criado e migrado no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET forte gerado
- [ ] CORS configurado para domínio de produção
- [ ] Build testado localmente (`npm run build`)

---

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18+ | Runtime |
| **TypeScript** | 5.3+ | Linguagem |
| **Express** | 4.18+ | Framework web |
| **Supabase** | - | PostgreSQL Database |
| **JWT** | 9.0+ | Autenticação |
| **Bcrypt** | 5.1+ | Hash de senhas |
| **Zod** | 3.22+ | Validação |
| **Helmet** | 7.1+ | Segurança |
| **CORS** | 2.8+ | CORS |

---

## 🧪 Testando

### Opção 1: cURL

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Opção 2: REST Client (VSCode/Cursor)

1. Instale a extensão **REST Client**
2. Abra o arquivo `requests.http`
3. Clique em "Send Request"

### Opção 3: Postman/Insomnia

Importe os exemplos deste README.

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento (hot reload)
npm run dev

# Build
npm run build

# Produção
npm start

# Limpar e reinstalar
rm -rf node_modules dist && npm install
```

---

## ⚠️ Problemas Comuns

### "Cannot find module"
```bash
npm install
```

### "ECONNREFUSED" no Supabase
- Verifique credenciais no `.env`
- Confirme que projeto Supabase está ativo

### Erro "Unauthorized"
- Verifique header `Authorization: Bearer TOKEN`
- Token expira em 15 min, use `/api/auth/refresh`

### Porta 3001 em uso
```env
# No .env
PORT=3001
```

---

## ✅ Checklist de Qualidade

- ✅ TypeScript strict mode
- ✅ Validação em todas as rotas
- ✅ Tratamento de erros centralizado
- ✅ Autenticação JWT segura
- ✅ Autorização por roles
- ✅ Código modular e organizado
- ✅ Documentação completa

---

## 🎯 Próximas Melhorias Sugeridas

### Funcionalidades
- [ ] Upload de arquivos (Supabase Storage)
- [ ] Notificações por email
- [ ] Relatórios em PDF
- [ ] Dashboard analytics
- [ ] Integração Receita Federal

### Técnicas
- [ ] Testes (Jest)
- [ ] Rate limiting
- [ ] Logging (Winston)
- [ ] Monitoramento (Sentry)
- [ ] Cache (Redis)
- [ ] Swagger/OpenAPI docs

---

## 📞 Suporte

- 📧 Email: contato@occ.com.br
- 🌐 Website: https://occ.com.br
- 📚 Arquivo `requests.http` - Exemplos prontos para testes

---

## 📄 Licença

MIT

---

**Desenvolvido para OCC**

> 💡 **Dica**: Para exemplos detalhados de cada endpoint, consulte o arquivo `requests.http` e teste diretamente com a extensão REST Client!

