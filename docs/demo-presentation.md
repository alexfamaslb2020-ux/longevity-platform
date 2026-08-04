# Demo Comercial — Longevity Platform (8–10 min)

Guia para apresentar a plataforma a uma empresa, usando apenas os dados fictícios
do ambiente demo (organização "Clínica Vida Longa").

> Regras da demonstração:
> - Todos os nomes, contactos e registos são fictícios.
> - Não apresentar números financeiros como factos — os valores da página de
>   apresentação são **estimativas** com pressupostos declarados.
> - Se algo falhar, não insistir: abrir a página `/presentation` (estado do
>   sistema) ou reiniciar com `scripts\start-demo.ps1`.

---

## Abertura — 1 min

**Frase inicial (sugestão):**

> "Vamos mostrar o percurso completo de um cliente nesta plataforma: da captação
> à retenção. Tudo o que vão ver são dados de demonstração — a proposta é a
> plataforma que acompanha toda a relação com o cliente, com CRM, automações,
> WhatsApp, IA e acompanhamento contínuo."

Abrir: `http://localhost:8080` → login `admin@longevity.local` / `dev-password-123`.

**Fazer:** abrir **Apresentação** (menu dourado na sidebar).
Mostrar o estado do sistema (todos os indicadores verdes) e a org "Clínica Vida Longa".

---

## Ato 1 — Captação: a equipa perde menos leads (2–3 min)

**Frase:**
> "Os leads entram de todos os canais e ficam num único pipeline, com priorização
> automática. O WhatsApp e a IA respondem ao primeiro contacto."

1. **Pipeline** — mostrar os 12 estágios, quantos leads em cada um.
2. **Leads** — abrir **João Silva** (ficha de detalhe):
   - Score, etapa, histórico de comunicações, notas.
3. **Comunicações (WhatsApp)** — mostrar conversa com assistente de IA
   (badge "IA geriu").
4. **Prova ao vivo** (o momento que mais impressiona):
   - Página do João Silva → botão **Enviar WhatsApp** →
     mensagem real (ex.: "Olá, só a confirmar o agendamento.") →
     em segundos a **IA responde** (resposta simulada no ambiente demo).

**Mensagem-chave:**
> "Nenhum lead fica por contactar: o sistema cria a tarefa, avisa a equipa e a IA
> responde fora de horas."

---

## Ato 2 — Conversão: mais clientes com menos trabalho manual (2–3 min)

**Frase:**
> "A equipa deixa de fazer trabalho manual repetitivo — o sistema cria as tarefas
> e as automações tratam do resto."

1. **Agenda** — mostrar avaliações e check-ups marcados (vista da equipa).
2. **Automações** — mostrar os 6 fluxos ativos
   (ex.: "Conversão: onboarding automático", "Check-in: intervenção em nível crítico").
3. **Voltar ao pipeline** e **mover o João Silva** uma etapa à frente
   (mostrar que a transição é imediata).

**Mensagem-chave:**
> "Converter um lead em cliente dispara onboarding, primeiro check-in e notificações
> — sem ninguém perder tempo a criar tarefas à mão."

---

## Ato 3 — Retenção: risco antes da desistência (2–3 min)

**Frase:**
> "O sistema acompanha o cliente todos os dias e avisa antes de ele desistir."

1. **Acompanhamento** — mostrar check-ins recentes, alertas e tarefas.
2. **Dashboard** — mostrar "Clientes em risco" e "Check-ins pendentes".
3. **Portal do cliente** — logout e login `cliente@longevity.local` / `dev-password-123`
   (ou abrir noutro separador): mostrar a experiência do cliente
   (responder a um check-in simulado).
4. Voltar ao login `admin@longevity.local`.

**Mensagem-chave:**
> "Cada alerta de risco tem intervenção orientada: tarefa, profissional e chamada
> de voz com IA. É assim que se evita a desistência."

---

## Valor e encerramento — 1–2 min

Voltar a **Apresentação** e mostrar a secção "Valor estimado da demonstração":

- **Receita recorrente** da carteira atual (calculada dos dados).
- **Potencial dos leads em pipeline** — estimativa rotulada (30% de conversão,
  ticket médio da carteira).
- **Receita mensal em risco** (clientes em risco × ticket médio).
- **Horas de equipa poupadas** com check-ins automáticos.

**Frase de encerramento:**
> "Com esta plataforma, a equipa comercial perde menos leads, a operação acompanha
> mais clientes com menos trabalho manual e o sistema identifica o risco de
> desistência antes de ela acontecer. Posso detalhar o que for do vosso interesse —
> incluindo integrações com o vosso WhatsApp, telefonia e IA."

---

## Checklist rápida antes da reunião

1. `scripts\prepare-demo.ps1` — sem erros (FAILLING = não apresentar).
2. `scripts\start-demo.ps1` — stack toda healthy.
3. Abrir `http://localhost:8080` e fazer login uma vez (aquecer o ambiente).
4. Cloudflare Tunnel (`cloudflared tunnel --url http://localhost:8080`) se houver
   audiência remota — testar o URL no telemóvel.
5. Ter um segundo separador pronto com o login do portal do cliente.

## O que NÃO mostrar na reunião

- Página **Integrações** (mostra 0 integrações reais — modo simulado).
- **Logs / Atividade técnica** (apenas para suporte).
- O botão "Repor demo" do dashboard (muda os dados à frente do cliente).
- Valores financeiros sem o disclaimer de estimativa.
