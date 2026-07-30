# Longevity Platform

Plataforma de gestão de longevidade e saúde preventiva.

## Stack

- **Backend**: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Infra**: Docker Compose (PostgreSQL + Redis)
- **Monorepo**: Turborepo + npm workspaces

## Pré-requisitos

- Node.js >= 22
- npm >= 11
- Docker Desktop (para PostgreSQL e Redis locais)

## Setup rápido

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
cd apps/api && npx prisma generate && cd ../..

# Iniciar infraestrutura
docker compose -f docker/docker-compose.yml up -d postgres redis

# Migrações
cd apps/api && npx prisma migrate dev --name initial_mvp && cd ../..

# Seed
cd apps/api && npx prisma db seed && cd ../..

# Iniciar desenvolvimento
npm run dev
```

## Credenciais locais (seed)

| Utilizador | Email | Password | Role |
|------------|-------|----------|------|
| Admin | admin@longevity.pt | admin123456 | ADMIN |
| Manager | manager@longevity.pt | manager123456 | MANAGER |
| Sales | sales@longevity.pt | sales123456 | SALES |
| Professional | prof@longevity.pt | prof123456 | PROFESSIONAL |
| Support | support@longevity.pt | support123456 | SUPPORT |
| Client | cliente@longevity.pt | cliente123456 | CLIENT |

## URLs locais

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **Health**: http://localhost:3001/api/v1/health
- **PostgreSQL**: localhost:5432 (user: longevity, password: longevity, db: longevity)
- **Redis**: localhost:6379

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar dev (API + Web) |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Testes unitários |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:push` | Push schema para DB |

## Estrutura

```
longevity-platform/
├── apps/
│   ├── api/          # NestJS API
│   │   ├── prisma/   # Schema + migrations + seed
│   │   └── src/
│   │       ├── common/       # Shared services
│   │       ├── config/       # Config modules
│   │       ├── modules/      # Feature modules
│   │       └── providers/    # Provider abstractions
│   └── web/          # Next.js Frontend
│       └── src/
│           ├── app/         # Pages (App Router)
│           ├── components/  # UI components
│           └── lib/         # API client + utils
├── packages/
│   └── shared/       # Shared types + constants
├── docker/           # Docker configuration
└── docs/             # Documentation
```

## Funcionalidades

### CRM
- Gestão de leads com pipeline visual
- Conversão de leads em clientes (transacional)
- Perfil completo de cliente com histórico
- Score de risco determinístico

### Automação
- Motor de eventos e workflows
- Ações: criar tarefa, alerta, notificação, mudar etapa, webhook
- 12 tipos de eventos suportados

### Check-ins e Risco
- Check-ins agendados (diário, semanal, mensal)
- Cálculo de risco explicável (fatores ponderados)
- Alertas automáticos

### Canais (Mock)
- WhatsApp (mock)
- Voz IA (mock)
- Providers abstraídos para troca futura

### Segurança
- JWT + refresh tokens
- RBAC (Admin, Manager, Sales, Professional, Support, Client)
- Isolamento multi-tenant por organização
- Audit log para ações sensíveis

## Estado do MVP

Ver `docs/mvp-validation.md` para a checklist completa de validação.
