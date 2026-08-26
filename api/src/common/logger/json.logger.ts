import { ConsoleLogger } from '@nestjs/common';
import type { LogLevel } from '@nestjs/common';

/**
 * Một dòng JSON mỗi log, ra stdout. Docker `json-file` driver gom lại, không
 * cần agent nào khác. Chỉ bật ở production — dev đọc log màu dễ hơn.
 */
export class JsonLogger extends ConsoleLogger {
  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
  ): void {
    for (const message of messages) {
      process.stdout.write(
        JSON.stringify({
          time: new Date().toISOString(),
          level: logLevel,
          context: context || undefined,
          message: this.stringify(message),
        }) + '\n',
      );
    }
  }

  private stringify(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) return message.stack ?? message.message;
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }
}
