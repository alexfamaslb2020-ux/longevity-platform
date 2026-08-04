# Contributing

Este é um projeto de demonstração e portefólio. Contribuições são bem-vindas se seguirem estas regras.

## Convenções

- Commits em inglês, estilo convencional: `feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`, `chore: ...`, `docs: ...`;
- Código sem `any` explícito — usa tipos do Prisma, interfaces locais ou `unknown` com narrowing;
- Formatação via Prettier (aspas duplas, ponto-e-vírgula, 2 espaços);
- Testes obrigatórios para funcionalidade nova (unit) e para fluxos cross-module (e2e).

## Fluxo

1. Fork do repositório e branch a partir de `main`;
2. Implementa a alteração com testes;
3. Corres as validações abaixo;
4. Abre um Pull Request para `main`.

## Validações antes de PR

```bash
npm run lint      # 0 erros, 0 warnings
npm run typecheck # sem erros
npm run test      # todas as suites verdes
```

Os testes e2e precisam de PostgreSQL e Redis (Docker) e correm serializados — ver `docs/testing.md`.

## Reportar problemas

Abre uma issue com: contexto, passos para reproduzir, comportamento esperado vs. real e ambiente (OS, versões Node/Docker).
