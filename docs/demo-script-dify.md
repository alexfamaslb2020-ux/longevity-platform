# Script de Demo — Plataforma Longevity + Agente IA (Dify + Ollama)

> Guião para a apresentação. Duração estimada: 8–10 min.
> Pré-requisitos: stacks ligados (ver "Checklist pré-demo" no fim).

---

## Cenário

Um potencial cliente envia uma mensagem no WhatsApp. O agente de IA
(Dify + Ollama local) responde automaticamente, sem intervenção humana,
e toda a conversa fica registada na plataforma (CRM + inbox).

---

## 1. Abertura — a arquitetura (1 min)

Mostrar o diagrama mental (desenhar ou verbalizar):

```
Cliente (WhatsApp)
   │
   ▼
Plataforma Longevity (NestJS API)
   │  webhook /api/v1/whatsapp/webhook
   ▼
Dify (workflow "Assistente Longevity")
   │  llama3.2:3b via Ollama (local, 100% offline, custo 0)
   ▼
Resposta AI → gravada na BD → enviada de volta ao cliente
```

**Frase:** "O cliente fala com a plataforma, que encaminha para um agente
orquestrado no Dify. O modelo corre localmente no Ollama — sem APIs pagas,
sem dados a sair da máquina."

---

## 2. Login (30 s)

1. Abrir `http://localhost:8080`
2. Login: `admin@longevity.local` / `dev-password-123`

**Frase:** "Entramos na plataforma como administrador da clínica."

---

## 3. O agente no Dify — o que o IA 'sabe' fazer (1 min)

1. Abrir `http://localhost` (Dify) num separador
2. **Studio** → app **"Assistente Longevity"**
3. Mostrar o workflow simplificado:
   - **Start** → **Question Classifier** (classifica a intenção)
   - 2 nós **LLM** (resposta) → **Answer**
4. Mostrar que o modelo é `Ollama / llama3.2:3b` (clique no nó LLM)
5. Abrir **API Access** → mostrar a API key (`app-...`)

**Frase:** "O workflow classifica a pergunta e gera a resposta. O modelo é
o llama3.2, a correr localmente — a integração usa a Service API do Dify."

---

## 4. O código — integração no backend (1 min)

Mostrar (rápido, sem abrir muitos ficheiros):

```
apps/api/src/modules/dify/
├── dify.module.ts      (módulo NestJS)
├── dify.service.ts     (chatMessage / runWorkflow / health)
├── dify.controller.ts  (GET /dify/health, POST /dify/chat)
└── dto/dify.dto.ts     (validação)
```

E a chamada a partir do WhatsApp (`whatsapp.service.ts:270`):

```
if (conversation.aiHandled && this.dify.enabled) {
  await this.replyWithDify(conversation.id, data);
}
```

**Frase:** "No módulo WhatsApp, quando chega uma mensagem de uma conversa
gerida por IA, a resposta é pedida ao Dify e devolvida ao cliente."

---

## 5. A demonstração ao vivo — o momento-chave (3 min)

### 5.1. Estado inicial

1. Abrir **Comunicações → WhatsApp Inbox** (`http://localhost:8080/comunicacoes`)
2. Mostrar a lista de conversas

### 5.2. Cliente envia mensagem (simulador da UI)

1. Clicar numa conversa existente, ou criar nova
2. Botão **"Simular resposta"** (o simulador envia uma mensagem como se
   fosse o cliente)
3. Observar **em tempo real**: a resposta do agente aparece na conversa,
   marcada com o selo de IA
4. Alternativa (mais impressionante): disparar pelo terminal com uma
   pergunta específica — ver **Anexo A**

### 5.3. Prova de que é o LLM real

1. Fazer uma pergunta aberta, por ex. via **Anexo A**:
   - "Quais são os benefícios do treino de força depois dos 50 anos?"
2. Mostrar a resposta gerada (não é um texto fixo — o modelo responde
   em tempo real)
3. Abrir `docker logs longevity-demo-api` → mostrar:
   - `Dify reply sent to +351... (message_id)`
4. (Opcional) Abrir a conversa na BD: `docker exec longevity-demo-db
   psql -U longevity_demo -d longevity_demo -c "SELECT role, content FROM messages WHERE conversation_id='...';"`

**Frase:** "O lead nem sequer existia — foi criado automaticamente a
partir da mensagem. A resposta foi gerada pelo LLM, gravada com
metadados do Dify, e enviada de volta pelo WhatsApp."

---

## 6. Health check ao vivo (30 s)

1. Em qualquer separador da plataforma (autenticado), testar:

```
curl -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/dify/health
```

ou mostrar no terminal da demo:

```
{"enabled":true,"configured":true,"reachable":true,"authenticated":true}
```

**Frase:** "Temos um endpoint de saúde da integração — dá para saber num
segundo se o Dify está configurado e autenticado."

---

## 7. Encerramento — o que fica de fora (1 min)

- **Memória por conversa**: o Dify mantém o contexto por utilizador
  (`user: whatsapp-<número>`) — numa próxima iteração ligamos o
  histórico da conversa ao agente para continuidade real.
- **RAG / Knowledge Base**: o workflow original do template incluía
  Knowledge Retrieval — a plataforma pode alimentar o agente com dados
  (exames, planos, preços) via datasets do Dify.
- **Escalabilidade**: hoje corre localmente para a demo; em produção
  basta trocar a base URL do Ollama por um provider na cloud.

---

## Anexo A — Comandos prontos para a demo

```powershell
# 1. Login e token
$body = '{"email":"admin@longevity.local","password":"dev-password-123"}'
[System.IO.File]::WriteAllText("$env:TEMP\login.json", $body)
$r = curl.exe -s "http://localhost:8080/api/v1/auth/login" -X POST -H "Content-Type: application/json" -d "@$env:TEMP\login.json" | ConvertFrom-Json
$token = $r.data.accessToken

# 2. Health da integração
curl.exe -s "http://localhost:8080/api/v1/dify/health" -H "Authorization: Bearer $token"

# 3. Pergunta direta ao agente (sem criar lead)
$q = '{"query":"Quais sao os beneficios do treino de forca depois dos 50 anos?"}'
[System.IO.File]::WriteAllText("$env:TEMP\chat.json", $q)
curl.exe -s "http://localhost:8080/api/v1/dify/chat" -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@$env:TEMP\chat.json"

# 4. Simular cliente no WhatsApp (cria lead + resposta AI)
$q = '{"to":"+351911122233","message":"Ola! Quero agendar uma avaliacao."}'
[System.IO.File]::WriteAllText("$env:TEMP\sim.json", $q)
curl.exe -s "http://localhost:8080/api/v1/demo/whatsapp/reply" -X POST -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d "@$env:TEMP\sim.json"
```

> Nota: usar sempre `-d "@$env:TEMP\....json"` — o PowerShell corrompe
> JSON inline com aspas simples.

---

## Checklist pré-demo (5 min antes)

```powershell
# 1. Stack longevity (porta 8080)
docker compose -f docker-compose.demo.yml ps        # docker/
# 2. Stack Dify (porta 80)
docker ps | Select-String dify
# 3. Ollama a correr + modelo presente
curl.exe http://localhost:11434/api/version
& "C:\Users\Alex\AppData\Local\Programs\Ollama\ollama.exe" list
# 4. Health end-to-end (com token) → enabled:true, authenticated:true
curl.exe http://localhost:8080/api/v1/health/live
```

Falhas comuns e correções:

| Sintoma | Causa | Correção |
|---|---|---|
| `enabled: false` no health | DIFY_API_KEY não chegou ao processo node | Confirmar `turbo.json` tem `DIFY_API_KEY` no `globalEnv`; rebuild: `docker compose -f docker-compose.demo.yml up -d --build api` |
| Chat responde 400 `gpt-3.5-turbo not exist` | Nó do workflow com modelo OpenAI | Trocar para Ollama/llama3.2:3b no Studio e publicar |
| `Dify reply skipped` nos logs | Ollama/Dify indisponível | `curl http://localhost:11434/api/version`; `docker compose -p dify up -d` |
| Resposta lenta (15–20 s) | GPU ocupada / RAM baixa | Fechar jogos/IDE pesados; GTX 1070 só faz ~20 tok/s com 3b |
