# Webhook Security

## Architecture

```
Provider ──▶ Raw Body Parser ──▶ Signature Verification ──▶ Idempotency Check ──▶ BullMQ Queue ──▶ Processor
```

## Signature Verification

All webhooks use HMAC-SHA256 with the following format:

```
signature = HMAC-SHA256(secret, timestamp + "." + rawBody)
```

Headers:
- `X-Hub-Signature-256`: HMAC signature
- `X-Hub-Timestamp`: Unix timestamp (seconds)

## Verification Process

1. Extract `X-Hub-Signature-256` and `X-Hub-Timestamp` from headers
2. Validate timestamp is within 300 seconds of server time
3. Compute `HMAC-SHA256(secret, "${timestamp}.${rawBody}")`
4. Compare using `crypto.timingSafeEqual` (constant-time)

## Endpoints

| Endpoint | Provider | Verification |
|----------|----------|--------------|
| `POST /api/v1/webhooks/whatsapp` | WhatsApp | HMAC-SHA256 (if `WHATSAPP_WEBHOOK_SECRET` set) |
| `POST /api/v1/webhooks/voice` | Voice AI | HMAC-SHA256 |

## Idempotency

Each webhook event is identified by `provider + externalEventId`:

```sql
UNIQUE(provider, externalEventId)
```

Flow:
1. Upsert `WebhookEvent` record
2. If duplicate with `COMPLETED` or `PROCESSING` status → discard
3. Otherwise → queue for processing

## Replay Protection

- Timestamp tolerance: 300 seconds
- Event ID uniqueness prevents duplicate processing
- Payload hash stored for integrity verification

## Retry Strategy (BullMQ)

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 30s |
| 3 | 2min |
| 4 | 10min |
| 5 | 30min |

After 5 failed attempts: marked as `FAILED` (dead-letter).

## Retry Management

- Admin UI endpoint: `GET /api/v1/webhooks/events/failed`
- Manual retry: `POST /api/v1/webhooks/events/:id/retry`
- Expired events (24h) are automatically cleaned up

## Provider Implementations

### Mock (current)
- Uses HMAC-SHA256 with configurable secret
- Generates mock event IDs

### Meta WhatsApp Cloud API (future)
- Verify `X-Hub-Signature-256` against raw body
- Use `WHATSAPP_WEBHOOK_SECRET` from config
- Extract `entry[0].changes[0].value.messages[0].id` as event ID

### Vapi (future)
- Verify `x-vapi-signature` header
- Use `VAPI_WEBHOOK_SECRET`
- Extract `call_id` as event ID

## Payload Validation

- Content-Type must be `application/json`
- Maximum payload size: 100KB
- Raw body stored only in memory during validation
- Raw body never logged
- Sanitized error messages only
