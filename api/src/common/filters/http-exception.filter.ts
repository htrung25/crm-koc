import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EBusinessCode } from '../enum/business-code.enum';

/** Thân lỗi mà service ném ra qua `new HttpException({...}, status)`. */
export interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
  businessCode?: EBusinessCode;
  statusCode?: number;
  [key: string]: unknown;
}

export interface ErrorResponse {
  statusCode: number;
  businessCode: EBusinessCode;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { body, status } = this.describe(exception);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): {
    status: number;
    body: Omit<ErrorResponse, 'path' | 'timestamp'> & Record<string, unknown>;
  } {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          businessCode: EBusinessCode.UNKNOWN_ERROR,
          error: 'Internal Server Error',
          message: 'Internal server error',
        },
      };
    }

    const status = exception.getStatus();
    const raw = exception.getResponse();

    // Dạng chuỗi: new HttpException('...', status) hoặc NotFoundException('...')
    if (typeof raw === 'string') {
      return {
        status,
        body: {
          statusCode: status,
          businessCode: EBusinessCode.UNKNOWN_ERROR,
          error: exception.name,
          message: raw,
        },
      };
    }

    // Dạng object: ValidationPipe trả message là MẢNG, giữ nguyên mảng đó.
    // Field lạ (clientIp của IP_WHITELIST_WOULD_LOCK_YOU_OUT) phải đi kèm ra
    // ngoài, không được nuốt mất.
    const {
      message,
      error,
      businessCode,
      statusCode: _ignored,
      ...extra
    } = raw as HttpExceptionBody;

    return {
      status,
      body: {
        ...extra,
        statusCode: status,
        businessCode: businessCode ?? EBusinessCode.UNKNOWN_ERROR,
        error: error ?? exception.name,
        message: message ?? exception.message,
      },
    };
  }
}
