# Security Policy

## Reporting a Vulnerability

Este é um projeto de demonstração/portefólio. Se encontrares uma vulnerabilidade, abre uma issue privada ou contacta o autor diretamente.

Por favor inclui:
- Descrição do problema;
- Passos para reproduzir;
- Impacto estimado;
- Sugestão de correção (opcional).

## Práticas atuais

- Todos os `.env` reais estão em `.gitignore` — apenas `.env.example` é versionado;
- Passwords armazenadas com `bcrypt` (12 rounds);
- Autenticação JWT com refresh tokens e rotação;
- Isolamento multi-tenant por `organizationId`, validado por testes e2e;
- Webhooks validam a origem e a assinatura — ver `docs/webhook-security.md`;
- Chaves de API externas (ex.: Dify) devem ser lidas de variáveis de ambiente, nunca hardcoded.

## Rotação de segredos

Se uma chave ou segredo foi alguma vez exposto (ex.: commit público), deve ser revogado e rotacionado imediatamente no serviço fornecedor.
