import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { EBusinessCode } from '../enum/business-code.enum';
import { ERole } from '../enum/roles.enum';
import { SystemConfigurationService } from '../../module/admin/system-configuration.service';
import { AuthenticatedAccount } from '../../module/auth/entities/authenticated.entity';

/** Kiểu thật của request sau khi guard chạy — guard luôn chạy TRƯỚC interceptor. */
type MaintenanceRequest = Request & { user?: AuthenticatedAccount };

/**
 * Đường luôn cho qua kể cả khi đang bảo trì
 * Endpoint sửa cấu hình không cần ở đây vì admin đã được miễn trừ theo vai trò.
 */
const ALWAYS_ALLOWED_PATHS = [
  '/login/admin',
  '/verify-otp',
  '/resend-otp',
  '/logout',
  // Health phải sống cả khi đang bảo trì, nếu không deploy gate và Uptime Kuma
  // sẽ hiểu nhầm là app chết.
  '/health',
  '/health/ready',
];

@Injectable()
export class AdminMaintenanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminMaintenanceInterceptor.name);

  constructor(
    private readonly systemConfigurationService: SystemConfigurationService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (await this.isSystemActive()) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<MaintenanceRequest>();

    // So khớp trên path, không phải url: url còn mang query string nên
    // includes() sẽ cho lọt cả '/x?next=/logout'.
    if (ALWAYS_ALLOWED_PATHS.includes(request.path)) {
      return next.handle();
    }

    // request.user do guard nạp, KHÔNG phải request.admin. Và field là
    // accountRole chứ không phải role — role chỉ có trong payload JWT.
    if (request.user?.accountRole === ERole.ADMIN) {
      return next.handle();
    }

    throw new HttpException(
      {
        businessCode: EBusinessCode.SYSTEM_UNDER_MAINTENANCE,
        error: 'Service Unavailable',
        message:
          'Hệ thống đang bảo trì. Chỉ có Admin mới có thể thao tác lúc này.',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private async isSystemActive(): Promise<boolean> {
    try {
      const toggles =
        await this.systemConfigurationService.getEnvironmentToggles();
      return toggles.ENV_SYSTEM_ACTIVE !== false;
    } catch (error) {
      this.logger.error(
        'Không đọc được cờ bảo trì, tạm coi hệ thống đang bật',
        error instanceof Error ? error.stack : String(error),
      );
      return true;
    }
  }
}
