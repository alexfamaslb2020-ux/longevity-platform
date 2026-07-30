# Provider Architecture

## Why Providers

Communication channels (WhatsApp, AI Voice) are abstracted behind interfaces so they can be swapped without changing business logic.

## WhatsApp

| File | Purpose |
|------|---------|
| `providers/whatsapp/types.ts` | `WhatsAppMessage`, `WhatsAppProvider` interface |
| `providers/whatsapp/mock.provider.ts` | In-memory mock; logs to console |
| `providers/whatsapp/whatsapp.service.ts` | Injects provider, sends/receives messages |
| `providers/whatsapp/whatsapp.module.ts` | Module config |

### Mock Provider
- Stores sent messages in memory (no external service)
- Logs to console with mock formatting
- Responds with fake message IDs

### Twilio (future)
Implement `WhatsAppProvider` interface:
```typescript
import Twilio from 'twilio';

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, body: string): Promise<WhatsAppMessage> {
    // Twilio API call
  }
}
```

## AI Voice

| File | Purpose |
|------|---------|
| `providers/calls/types.ts` | `CallRequest`, `CallProvider` interface |
| `providers/calls/mock.provider.ts` | Simulates call, stores record |
| `providers/calls/calls.service.ts` | Business logic for calls |
| `providers/calls/calls.module.ts` | Module config |

### Mock Provider
- Simulates call "connection"
- Returns fake duration and status
- No actual audio processing

### ElevenLabs / Retell (future)
```typescript
export class ElevenLabsCallProvider implements CallProvider {
  async initiateCall(request: CallRequest): Promise<CallRecord> {
    // ElevenLabs API
  }
}
```

## Adding a New Provider

1. Implement the interface from `types.ts`
2. Register with DI in the module's `providers` array
3. Update the env config with new credentials
4. Done — no business logic changes needed
