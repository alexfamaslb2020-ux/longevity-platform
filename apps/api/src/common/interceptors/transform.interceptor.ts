import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { randomUUID } from "crypto";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: request.headers["x-request-id"] || randomUUID(),
        },
      })),
    );
  }
}
