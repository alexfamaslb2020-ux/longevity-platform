import { Injectable, Logger } from "@nestjs/common";
import { AutomationEvent, AutomationEventPayload } from "./events";

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);
  private handlers: Map<
    string,
    ((payload: AutomationEventPayload) => Promise<void>)[]
  > = new Map();

  on(
    event: AutomationEvent,
    handler: (payload: AutomationEventPayload) => Promise<void>,
  ) {
    const key = event;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);
  }

  async publish(
    event: AutomationEvent,
    payload: Omit<AutomationEventPayload, "event" | "timestamp">,
  ) {
    const fullPayload: AutomationEventPayload = {
      ...payload,
      event,
      timestamp: new Date(),
      correlationId: payload.correlationId || crypto.randomUUID(),
    };

    const handlers = this.handlers.get(event) || [];
    this.logger.log(
      `Publishing event ${event} (${fullPayload.correlationId}) to ${handlers.length} handlers`,
    );

    await Promise.allSettled(
      handlers.map((h) =>
        h(fullPayload).catch((err) => {
          this.logger.error(`Handler failed for ${event}: ${err.message}`);
        }),
      ),
    );
  }
}
