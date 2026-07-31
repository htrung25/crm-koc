import { createHash } from 'node:crypto';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * ThrottlerGuard mặc định đếm theo IP. Guard này đếm theo TOKEN nếu request
 * có Authorization, còn lại mới rơi về IP.
 *
 * Vì sao: nhiều client dùng chung một IP (NAT công ty, mạng di động) sẽ chặn
 * nhầm lẫn nhau nếu chỉ đếm theo IP. Ngược lại, endpoint công khai như
 * /login chưa có token nên IP là thứ duy nhất bám được.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as Record<string, string | undefined>;
    const auth = headers?.authorization;

    if (auth) {
      // Hash để không đưa nguyên token vào key Redis/log
      const hash = createHash('sha256').update(auth).digest('hex').slice(0, 32);
      return Promise.resolve(`token:${hash}`);
    }

    // req.ips có giá trị khi bật trust proxy; phần tử đầu là client thật
    const ips = req.ips as string[] | undefined;
    const ip = ips?.length ? ips[0] : (req.ip as string | undefined);
    return Promise.resolve(`ip:${ip ?? 'unknown'}`);
  }

  /**
   * Tách bộ đếm theo từng route.
   *
   * Mặc định throttler gộp key theo class + handler, nhưng để rõ ràng thì
   * đưa luôn method + path vào: spam /login không làm cạn hạn mức của
   * /verify-otp, và ngược lại.
   */
  protected generateKey(
    context: ExecutionContext,
    suffix: string,
    name: string,
  ): string {
    const req = context.switchToHttp().getRequest<{
      method?: string;
      route?: { path?: string };
    }>();
    const route = `${req.method ?? 'ALL'} ${req.route?.path ?? 'unknown'}`;

    return createHash('sha256')
      .update(`${name}:${route}:${suffix}`)
      .digest('hex');
  }
}
