# Longevity Platform

Plataforma de saúde e longevidade com IA integrada: CRM, automações de WhatsApp, assistente de voz, agentes de LLM e acompanhamento contínuo de clientes — da captação à retenção.

> Projeto de portefólio full-stack com Inteligência Artificial aplicada a um caso de negócio real: subscrição mensal com check-ins de saúde semanais, monitorização de risco e portal do cliente.

![Dashboard](docs/screenshots/dashboard.png)

## O que faz

| Área | Funcionalidades |
|---|---|
| **CRM** | Pipeline de captação (lead → qualificação → proposta → cliente), tarefas, notas, histórico de conversas e chamadas |
| **IA (agentes LLM)** | Atendimento automático por agente de linguagem (Dify + Ollama local), classificação de intenções, respostas em português com regras de negócio |
| **WhatsApp** | Check-ins semanais de saúde (escala 1–5 + dificuldades), respostas automáticas via webhook, lembretes e recomendações |
| **Voz (IA)** | Assistente telefónico "Sofia" com transcrição automática associada ao registo do cliente |
| **Retenção** | Risco de desistência calculado automaticamente, alertas em tempo real, tarefas de intervenção |
| **Portal do cliente** | Check-ins, consultas, evolução, subscrição e avisos — vista dedicada ao cliente |
| **Modo demonstração** | Journey de 14 passos que reproduz o ciclo de vida completo de um cliente num clique |

## Stack

- **Backend**: NestJS (Node.js/TypeScript) + Prisma + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js + Tailwind CSS + shadcn/ui
- **IA**: Dify (orquestração de agentes) + Ollama (LLM local — privacidade dos dados) + retry com tolerância a falhas
- **Infra**: Docker Compose (8 serviços: web, api, postgres, redis, worker, nginx, dify, dify-worker), Turborepo
- **Integrações**: webhooks de WhatsApp, voz simulada com transcrição, providers mock em modo demo

## Arquitetura (visão geral)

```
Cliente ── WhatsApp webhook / formulário ──► API (NestJS) ──► PostgreSQL / Redis
                                                  │
                                                  ├──► Dify (classificador + agente LLM) ──► Ollama (modelo local)
                                                  │
                                                  ├──► Fila BullMQ (automações, check-ins, alertas)
                                                  │
                                                  └──► Notificações + Portal do cliente (Next.js)
```

## Como correr

Pré-requisitos: Docker + Docker Compose.

```bash
cp .env.demo .env
docker compose -f docker/docker-compose.demo.yml up -d --build
npm run prisma:migrate   # ou o equivalente do monorepo
npm run seed             # dados de demonstração
```

Aceder:
- Web: http://localhost:8080
- Admin demo: `admin@longevity.local` / `dev-password-123`
- Portal do cliente: `cliente@longevity.local` / `dev-password-123`

## Modo demonstração

O dashboard inclui o botão **"Reproduzir demonstração"**: um journey de 14 passos que cria o ciclo de vida completo de um cliente — formulário do site, qualificação com score, atendimento por WhatsApp com IA, chamada de voz com transcrição, avaliação, conversão, subscrição Premium, check-in com alerta, risco de desistência e portal do cliente. O botão **"Repor demo"** limpa os dados criados.

As estimativas de negócio (MRR, potencial de pipeline, receita em risco, horas poupadas) são calculadas a partir dos dados de demonstração e apresentadas na página de apresentação (`/presentation`).

## Estrutura

```
apps/
  api/     # NestJS — autenticação, CRM, webhooks, automações, demo journey
  web/     # Next.js — dashboard, pipeline, comunicacoes, checkins, portal do cliente, presentation
docker/    # docker-compose demo (8 serviços)
scripts/   # prepare-demo, start-demo (verificação de 17 pontos)
docs/      # documentação e roteiro da demonstração
```

## Notas de segurança

- Todos os `.env` reais estão ignorados (apenas `.env.example` versionados)
- IA local (Ollama) para garantir privacidade de dados de saúde
- Modo demo com providers mock (WhatsApp, voz, pagamentos) — nenhum serviço pago é contactado
