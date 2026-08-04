import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import type {
  DifyChatMessageRequest,
  DifyChatMessageResponse,
  DifyWorkflowRunRequest,
  DifyWorkflowRunResponse,
} from "./dify.types";

@Injectable()
export class DifyService {
  private readonly logger = new Logger(DifyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>(
      "integrations.dify.baseUrl",
      "http://host.docker.internal:80/v1",
    );
  }

  private get apiKey(): string {
    return this.configService.get<string>("integrations.dify.apiKey", "");
  }

  private get timeoutMs(): number {
    return this.configService.get<number>("integrations.dify.timeoutMs", 30000);
  }

  get enabled(): boolean {
    return Boolean(this.apiKey);
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    if (!this.apiKey) {
      throw new BadRequestException({
        code: "DIFY_NOT_CONFIGURED",
        message: "Dify não configurado — defina DIFY_API_KEY no ambiente",
      });
    }
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.post(`${this.baseUrl}${path}`, body, {
            headers: this.headers,
            timeout: this.timeoutMs,
          }),
        );
        return response.data as T;
      } catch (error: any) {
        const status = error?.response?.status;
        const data = error?.response?.data;
        const retriable =
          attempt < maxAttempts &&
          status !== 401 &&
          status !== 403 &&
          (status >= 400 || !status);
        if (retriable) {
          this.logger.warn(
            `Dify request failed (${path}, attempt ${attempt}/${maxAttempts}): ${error.message} — a tentar novamente`,
          );
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }
        this.logger.error(
          `Dify request failed (${path}): ${error.message}`,
          data ?? undefined,
        );
        if (error instanceof HttpException) throw error;
        throw new BadRequestException({
          code: "DIFY_API_ERROR",
          message: "Erro ao comunicar com o Dify",
          details: { path, status, data },
        });
      }
    }
    throw new BadRequestException({
      code: "DIFY_API_ERROR",
      message: "Erro ao comunicar com o Dify",
    });
  }

  async chatMessage(
    request: DifyChatMessageRequest,
  ): Promise<DifyChatMessageResponse> {
    return this.post<DifyChatMessageResponse>("/chat-messages", {
      inputs: request.inputs ?? {},
      query: request.query,
      response_mode: "blocking",
      conversation_id: request.conversation_id ?? "",
      user: request.user,
    });
  }

  async runWorkflow(
    request: DifyWorkflowRunRequest,
  ): Promise<DifyWorkflowRunResponse> {
    return this.post<DifyWorkflowRunResponse>("/workflows/run", {
      inputs: request.inputs,
      response_mode: "blocking",
      user: request.user,
    });
  }

  async health() {
    if (!this.enabled) {
      return {
        enabled: false,
        configured: false,
        baseUrl: this.baseUrl,
        message:
          "Dify não configurado — defina DIFY_API_KEY para ativar a integração",
      };
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/parameters`, {
          headers: this.headers,
          timeout: this.timeoutMs,
        }),
      );
      return {
        enabled: true,
        configured: true,
        baseUrl: this.baseUrl,
        reachable: true,
        authenticated: response.status === 200,
      };
    } catch (error: any) {
      return {
        enabled: true,
        configured: true,
        baseUrl: this.baseUrl,
        reachable: false,
        error: error?.response?.data?.message || error.message,
      };
    }
  }
}
