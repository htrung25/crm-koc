import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Observable } from 'rxjs';
import { CampaignAssetService } from '../../module/brand/campaign-asset.service';

@Injectable()
export class CampaignAssetUploadInterceptor implements NestInterceptor {
  constructor(private readonly assets: CampaignAssetService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    // Read the configured limit BEFORE multer allocates the file buffer.
    const Upload = FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: await this.assets.maxUploadBytes(),
        files: 1,
        fields: 3,
        fieldSize: 256,
        // Busboy emits partsLimit when the count reaches the limit. Permit
        // the four valid parts; files/fields still enforce exactly 1 + 3.
        parts: 5,
      },
    });
    return new Upload().intercept(context, next);
  }
}
