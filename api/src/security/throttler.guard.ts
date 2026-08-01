import { createHash } from 'node:crypto';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
// import type: isolatedModules + emitDecoratorMetadata cấm dùng type thường
// trong chữ ký constructor đã decorate
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { EThrottleKeyMode } from '../common/enum/throttle-key-modes.enum';
import { THROTTLE_KEY_MODE } from './throttle-key.decorator';

interface ThrottledRequest {
  headers?: Record<string, string | undefined>;
  user?: { id?: string };
  body?: { email?: unknown };
  ip?: string;
  ips?: string[];
  method?: string;
  route?: { path?: string };
}

/** Chặn key phình to nếu client gửi chuỗi email dài bất thường. */
const MAX_EMAIL_KEY_LENGTH = 254;

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as ThrottledRequest;
    const accountId = this.resolveAccountId(request);

    // Đã đăng nhập: đếm theo account để nhiều người sau cùng một NAT không
    // chặn nhầm nhau. Chưa đăng nhập thì IP là thứ duy nhất bám được.
    return Promise.resolve(
      accountId ? `account:${accountId}` : `ip:${this.resolveIp(request)}`,
    );
  }

  /**
   * Ghép route vào khoá để mỗi endpoint có bộ đếm riêng, và ghép thêm IP khi
   * route khai @ThrottleKey(ACCOUNT_AND_IP).
   *
   * Phần ACCOUNT_AND_IP phải làm ở đây chứ không phải getTracker, vì
   * getTracker chỉ nhận req còn metadata thì cần ExecutionContext.
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const request = context.switchToHttp().getRequest<ThrottledRequest>();
    const route = `${request.method ?? 'ALL'} ${request.route?.path ?? 'unknown'}`;

    const mode = this.reflector.getAllAndOverride<EThrottleKeyMode>(
      THROTTLE_KEY_MODE,
      [context.getHandler(), context.getClass()],
    );

    const parts = [name, route];

    switch (mode) {
      case EThrottleKeyMode.EMAIL_AND_IP: {
        // Email lấy từ body chứ không phải getTracker: chỉ route nào khai
        // EMAIL_AND_IP mới được dùng, tránh việc endpoint như /register bị
        // qua mặt bằng cách đổi email mỗi request là có bucket mới.
        const email = this.resolveEmail(request);
        parts.push(email ? `email:${email}` : suffix, this.resolveIp(request));
        break;
      }
      case EThrottleKeyMode.ACCOUNT_AND_IP:
        parts.push(suffix, this.resolveIp(request));
        break;
      default:
        parts.push(suffix);
    }

    return createHash('sha256').update(parts.join(':')).digest('hex');
  }

  private resolveAccountId(request: ThrottledRequest): string | null {
    // Trường hợp guard được gắn ở controller (chạy sau JwtAuthGuard)
    if (request.user?.id) {
      return request.user.id;
    }

    const auth = request.headers?.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<{ sub?: string }>(auth.slice(7));
      return payload.sub ?? null;
    } catch {
      // Token hỏng/hết hạn: coi như chưa đăng nhập, đếm theo IP. Nếu cấp
      // bucket riêng cho token rác thì kẻ tấn công chỉ cần đổi token mỗi
      // request là thoát hết giới hạn.
      return null;
    }
  }

  /**
   * Email trong body, chuẩn hoá giống lúc lưu DB để 'A@X.com' và 'a@x.com'
   * dùng chung một bộ đếm. Thiếu email thì trả null để caller rơi về IP —
   * bỏ trống email không được biến thành cách thoát giới hạn.
   */
  private resolveEmail(request: ThrottledRequest): string | null {
    const raw = request.body?.email;
    if (typeof raw !== 'string') {
      return null;
    }
    const email = raw.trim().toLowerCase();
    return email && email.length <= MAX_EMAIL_KEY_LENGTH ? email : null;
  }

  private resolveIp(request: ThrottledRequest): string {
    // req.ips chỉ có giá trị khi bật trust proxy; phần tử đầu là client thật
    const ips = request.ips;
    return ips?.length ? ips[0] : (request.ip ?? 'unknown');
  }
}
