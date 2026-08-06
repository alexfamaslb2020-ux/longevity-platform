# Changelog

Todas as mudanças notáveis são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/).

## [Unreleased]

### Added
- **Assistente IA com RAG (pgvector)** — novo módulo `ai-assistant`:
  - Embeveggings locais determinísticos (feature-hashing, 384 dims, sem dependências externas) com provider `ollama` opcional;
  - Pesquisa semântica PostgreSQL (`vector` + HNSW `vector_cosine_ops`) com fontes citadas por resposta;
  - Classificação de intenções determinística (preços, agendamento, check-ins, FAQ);
  - Function calling com agendamento real: proposta de horários → confirmação → `Appointment` + auditoria (`tool_calls`);
  - Avaliação explicável de cada resposta (6 critérios: grounding, recusa honesta, fontes, ferramenta, latência, completude);
  - 5 documentos sintéticos em PT prontos para demo (`POST /ai-assistant/demo/seed-documents`);
  - Fallback RAG no WhatsApp quando não há chave Dify (ou quando o Dify falha);
  - Página demo `Assistente IA (RAG)` na web (`/ia`) com chat, fontes e avaliações;
  - 18 testes unitários novos + suite e2e completa (10 cenários);
- Badges de CI/versões no README;
- Diagrama de arquitetura Mermaid;
- `LICENSE` (MIT), `SECURITY.md`, `CONTRIBUTING.md`;
- Screenshots da demo (`docs/screenshots/`);
- `.dockerignore` (builds mais rápidos e contexto sem `.env`).

### Changed
- PostgreSQL demo/staging para `pgvector/pgvector:pg16` (extensão `vector`);
- Variáveis `RAG_*` em `.env.demo.example`, `turbo.json` e `docker-compose.demo.yml`;
- README reestruturado para apresentação a recrutadores;
- Tipos removidos: zero warnings `no-explicit-any` no API (payloads de webhooks e JWT tipados).

### Fixed
- Chave de API do Dify hardcoded em `scripts/prepare-demo.ps1` — agora lida de `.env.demo`;
- Clientes Redis não fechados em shutdown — `OnModuleDestroy` adicionado (jest sai sem handles abertos);
- `forceExit` removido dos testes e2e;
- Quick Start reproduzível a partir de um clone limpo (PowerShell + `start-demo.bat`, sem Node.js local);
- `.env.demo` criado automaticamente a partir de `.env.demo.example`;
- Nome de projeto Docker determinístico (`longevity-demo`);
- Passo de seed em falta em `scripts/start-demo.ps1`;
- Documentação de execução local corrigida (`cp .env.demo .env` → `Copy-Item .env.demo.example .env.demo`).

## [v0.1.0-demo] - 2026

### Added
- CRM: pipeline de captação, tarefas, notas, histórico;
- IA: agente Dify + Ollama com fallback por regras;
- WhatsApp: check-ins semanais e respostas automáticas via webhook;
- Voz: assistente "Sofia" com transcrição;
- Retenção: risco de desistência e alertas;
- Portal do cliente;
- Modo demonstração (journey de 14 passos);
- Docker Compose demo (5 serviços), Turborepo, CI GitHub Actions;
- Suite de testes unitários (33) e e2e (35).
