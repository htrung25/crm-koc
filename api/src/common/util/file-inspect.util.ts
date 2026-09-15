import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

export interface InspectedFile {
  /** Mime THẬT, đọc từ magic bytes. */
  mimeType: string;
  sizeBytes: number;
  /** SHA-256, để phát hiện nộp lại đúng file vừa bị từ chối. */
  checksum: string;
}

export async function inspectFile(
  buffer: Buffer,
  maxSizeBytes: number,
  allowedMimes: readonly string[],
): Promise<InspectedFile> {
  if (buffer.length === 0) {
    throw new BadRequestException('file is empty');
  }
  if (buffer.length > maxSizeBytes) {
    throw new BadRequestException(
      `file exceeds ${maxSizeBytes} bytes (got ${buffer.length})`,
    );
  }

  // Truncated signatures can make file-type throw instead of returning undefined.
  const detected = await fileTypeFromBuffer(buffer).catch(() => undefined);
  if (!detected || !allowedMimes.includes(detected.mime)) {
    throw new BadRequestException(
      `unsupported file type; allowed: ${allowedMimes.join(', ')}`,
    );
  }

  return {
    mimeType: detected.mime,
    sizeBytes: buffer.length,
    checksum: createHash('sha256').update(buffer).digest('hex'),
  };
}
