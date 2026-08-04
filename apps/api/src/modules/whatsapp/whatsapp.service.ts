import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../../common/prisma.service";
import { MESSAGING_PROVIDER } from "../../providers/providers.module";
import type { MessagingProvider } from "../../providers/interfaces";
import { ConversationChannel, MessageRole, LeadSource } from "@prisma/client";
import { AutomationService } from "../automation/automation.service";
import { AutomationEvent } from "../automation/events";
import { DifyService } from "../dify/dify.service";

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  type: string;
  timestamp: string;
  text?: { body?: string };
  interactive?: {
    button_reply?: { title?: string };
    list_reply?: { title?: string };
  };
  button?: { text?: string };
}

export interface WhatsAppWebhookValue {
  messages?: WhatsAppWebhookMessage[];
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
}

export interface WhatsAppWebhookPayload {
  entry?: {
    changes?: { value?: WhatsAppWebhookValue }[];
  }[];
  messages?: WhatsAppWebhookMessage[];
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl: string;

  constructor(
    @Inject(MESSAGING_PROVIDER)
    private readonly messagingProvider: MessagingProvider,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly automation: AutomationService,
    private readonly dify: DifyService,
  ) {
    const version = this.configService.get<string>(
      "integrations.whatsapp.apiVersion",
    );
    const phoneNumberId = this.configService.get<string>(
      "integrations.whatsapp.phoneNumberId",
    );
    this.baseUrl = `https://graph.facebook.com/${version}/${phoneNumberId}`;
  }

  private cachedOrgId: string | null | undefined;

  private async defaultOrganizationId(): Promise<string | null> {
    if (this.cachedOrgId !== undefined) return this.cachedOrgId;
    const org = await this.prisma.organization.findFirst({
      orderBy: { createdAt: "asc" },
    });
    this.cachedOrgId = org?.id ?? null;
    return this.cachedOrgId;
  }

  private get apiKey(): string {
    return this.configService.get<string>("integrations.whatsapp.apiKey") || "";
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async sendText(to: string, text: string, previewUrl = false) {
    if (!this.apiKey) {
      const result = await this.messagingProvider.sendMessage({ to, text });
      this.logger.log(
        `[Provider] Message sent via ${this.messagingProvider.name}: ${result.providerId}`,
      );
      return result;
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { preview_url: previewUrl, body: text },
          },
          { headers: this.headers },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown } };
      this.logger.error(
        `WhatsApp send error: ${err.message}`,
        err.response?.data,
      );
      throw new BadRequestException({
        code: "WHATSAPP_SEND_ERROR",
        message: "Erro ao enviar mensagem WhatsApp",
        details: err.response?.data,
      });
    }
  }

  async sendTemplate(
    to: string,
    templateName: string,
    parameters: Record<string, string>[] = [],
  ) {
    if (!this.apiKey) {
      const result = await this.messagingProvider.sendMessage({
        to,
        text: "",
        templateName,
        templateParams: parameters,
      });
      return result;
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template",
            template: {
              name: templateName,
              language: { code: "pt_PT" },
              components:
                parameters.length > 0
                  ? [
                      {
                        type: "body",
                        parameters: parameters.map((p) => ({
                          type: "text",
                          text: p,
                        })),
                      },
                    ]
                  : undefined,
            },
          },
          { headers: this.headers },
        ),
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: unknown } };
      this.logger.error(
        `WhatsApp template error: ${err.message}`,
        err.response?.data,
      );
      throw new BadRequestException({
        code: "WHATSAPP_TEMPLATE_ERROR",
        message: "Erro ao enviar template WhatsApp",
        details: err.response?.data,
      });
    }
  }

  async markAsRead(messageId: string) {
    if (!this.apiKey) return;
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/messages`,
          {
            messaging_product: "whatsapp",
            status: "read",
            message_id: messageId,
          },
          { headers: this.headers },
        ),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(`WhatsApp markAsRead error: ${err.message}`);
    }
  }

  async processIncomingMessage(payload: WhatsAppWebhookPayload) {
    if (!this.apiKey) {
      const events = await this.messagingProvider.parseWebhook(payload);
      for (const event of events) {
        if (event.type === "message_received") {
          await this.handleMessage({
            from: event.from,
            contactName: event.from,
            messageId: event.id,
            type: "text",
            timestamp: event.timestamp,
            content: event.content,
          });
        }
      }
      return;
    }

    if (!payload.entry?.[0]?.changes?.[0]?.value) {
      throw new BadRequestException({
        code: "INVALID_PAYLOAD",
        message: "Payload WhatsApp inválido",
      });
    }

    const value = payload.entry[0].changes[0].value;
    const messages = value.messages || [];
    const contacts = value.contacts || [];

    for (const message of messages) {
      const from = message.from;
      const contact = contacts.find((c) => c.wa_id === from);

      await this.handleMessage({
        from,
        contactName: contact?.profile?.name || "Desconhecido",
        messageId: message.id,
        type: message.type,
        timestamp: message.timestamp,
        content: this.extractMessageContent(message),
      });
    }
  }

  private async handleMessage(data: {
    from: string;
    contactName: string;
    messageId: string;
    type: string;
    timestamp: string;
    content: string;
  }) {
    // Find or create conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        channel: ConversationChannel.WHATSAPP,
        OR: [
          { lead: { phone: data.from } },
          { customer: { lead: { phone: data.from } } },
        ],
        status: "active",
      },
      include: { messages: { take: 1, orderBy: { sentAt: "desc" } } },
    });

    // Find existing lead/customer by phone
    const lead = await this.prisma.lead.findFirst({
      where: { phone: data.from },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          channel: ConversationChannel.WHATSAPP,
          leadId: lead?.id,
          status: "active",
          aiHandled: true,
          metadata: { waContactName: data.contactName },
        },
        include: { messages: { take: 1, orderBy: { sentAt: "desc" } } },
      });
    }

    // Store message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: data.content,
        role: MessageRole.USER,
        contentType: data.type,
        metadata: {
          waMessageId: data.messageId,
          waTimestamp: data.timestamp,
        },
      },
    });

    // Update lead last contacted
    if (lead) {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { lastContactedAt: new Date() },
      });
    }

    // AI reply via Dify (only when DIFY_API_KEY is configured)
    if (conversation.aiHandled && this.dify.enabled) {
      await this.replyWithDify(conversation.id, data);
    }

    // If no lead exists, create one
    let resolvedLeadId = lead?.id || null;
    if (!lead) {
      const newLead = await this.prisma.lead.create({
        data: {
          name: data.contactName,
          phone: data.from,
          source: LeadSource.WHATSAPP,
          organizationId: await this.defaultOrganizationId(),
        },
      });

      resolvedLeadId = newLead.id;

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { leadId: newLead.id },
      });

      this.logger.log(
        `Lead created from WhatsApp message: ${data.contactName}`,
      );
    }

    const customer = conversation.customerId
      ? await this.prisma.customer.findUnique({
          where: { id: conversation.customerId },
          select: { organizationId: true },
        })
      : null;

    if (customer?.organizationId) {
      await this.automation.publish(AutomationEvent.MESSAGE_RECEIVED, {
        entityId: conversation.id,
        entityType: "conversation",
        organizationId: customer.organizationId,
        data: {
          conversationId: conversation.id,
          leadId: resolvedLeadId,
          customerId: conversation.customerId,
          from: data.from,
          content: data.content,
        },
      });
    }

    return conversation;
  }

  private async replyWithDify(
    conversationId: string,
    data: { from: string; contactName: string; content: string },
  ) {
    try {
      const result = await this.dify.chatMessage({
        query: data.content,
        user: `whatsapp-${data.from}`,
        inputs: {
          contactName: data.contactName,
          from: data.from,
        },
      });

      await this.prisma.message.create({
        data: {
          conversationId,
          content: result.answer,
          role: MessageRole.AI,
          contentType: "text",
          metadata: {
            dify: true,
            difyMessageId: result.message_id,
            difyConversationId: result.conversation_id,
          },
        },
      });

      await this.sendText(data.from, result.answer);

      this.logger.log(`Dify reply sent to ${data.from} (${result.message_id})`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(`Dify reply skipped for ${data.from}: ${err.message}`);
    }
  }

  private extractMessageContent(message: WhatsAppWebhookMessage): string {
    switch (message.type) {
      case "text":
        return message.text?.body || "";
      case "interactive":
        return (
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          ""
        );
      case "button":
        return message.button?.text || "";
      case "order":
        return "Pedido realizado";
      default:
        return `[${message.type}]`;
    }
  }

  async handleWebhookVerify(mode: string, token: string, challenge: string) {
    if (!this.apiKey) {
      return challenge;
    }
    const verifyToken = this.configService.get<string>(
      "integrations.whatsapp.webhookSecret",
    );
    if (mode === "subscribe" && token === verifyToken) {
      return challenge;
    }
    throw new BadRequestException({
      code: "VERIFICATION_FAILED",
      message: "Verificação falhou",
    });
  }
}
