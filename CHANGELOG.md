# Changelog

Todas as mudanças notáveis são documentadas aqui. Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/).

## [Unreleased]

### Added
- Badges de CI/versões no README;
- Diagrama de arquitetura Mermaid;
- `LICENSE` (MIT), `SECURITY.md`, `CONTRIBUTING.md`;
- Screenshots da demo (`docs/screenshots/`).

### Changed
- README reestruturado para apresentação a recrutadores;
- Tipos removidos: zero warnings `no-explicit-any` no API (payloads de webhooks e JWT tipados).

### Fixed
- Chave de API do Dify hardcoded em `scripts/prepare-demo.ps1` — agora lida de `.env.demo`;
- Clientes Redis não fechados em shutdown — `OnModuleDestroy` adicionado (jest sai sem handles abertos);
- `forceExit` removido dos testes e2e.

## [v0.1.0-demo] - 2026

### Added
- CRM: pipeline de captação, tarefas, notas, histórico;
- IA: agente Dify + Ollama com fallback por regras;
- WhatsApp: check-ins semanais e respostas automáticas via webhook;
- Voz: assistente "Sofia" com transcrição;
- Retenção: risco de desistência e alertas;
- Portal do cliente;
- Modo demonstração (journey de 14 passos);
- Docker Compose demo (8 serviços), Turborepo, CI GitHub Actions;
- Suite de testes unitários (33) e e2e (35).
