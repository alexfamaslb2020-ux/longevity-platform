import { IsString, IsOptional, IsObject } from "class-validator";

export class ChatDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  @IsObject()
  inputs?: Record<string, unknown>;
}

export class WorkflowDto {
  @IsObject()
  inputs: Record<string, unknown>;

  @IsOptional()
  @IsString()
  user?: string;
}
