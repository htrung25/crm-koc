import { createHash } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import {
  ALLOWED_DOCUMENT_MIMES,
  AllowedDocumentMime,
} from '../constants/kyc-storage.constants';

export interface InspectedDocument {
  /** Mime THẬT, đọc từ magic bytes. */
  mimeType: AllowedDocumentMime;
  sizeBytes: number;
  /** SHA-256, để phát hiện nộp lại đúng file vừa bị từ chối. */
  checksum: string;
}

export async function inspectDocument(
  buffer: Buffer,
  maxSizeBytes: number,
): Promise<InspectedDocument> {
  if (buffer.length === 0) {
    throw new BadRequestException('file is empty');
  }
  if (buffer.length > maxSizeBytes) {
    throw new BadRequestException(
      `file exceeds ${maxSizeBytes} bytes (got ${buffer.length})`,
    );
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !isAllowed(detected.mime)) {
    throw new BadRequestException(
      `unsupported file type; allowed: ${ALLOWED_DOCUMENT_MIMES.join(', ')}`,
    );
  }

  return {
    mimeType: detected.mime,
    sizeBytes: buffer.length,
    checksum: createHash('sha256').update(buffer).digest('hex'),
  };
}

function isAllowed(mime: string): mime is AllowedDocumentMime {
  return (ALLOWED_DOCUMENT_MIMES as readonly string[]).includes(mime);
}
