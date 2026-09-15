import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { Readable } from 'node:stream';
import { ERole } from '../../common/enum/roles.enum';
import type { StorageStreamResult } from '../../common/services/storage.service';
import { JwtAuthGuard } from '../../security/jwt-auth.guard';
import { Roles } from '../../security/roles.decorator';
import { RolesGuard } from '../../security/roles.guard';
import type { AuthenticatedAccount } from '../auth/types/authenticated.types';
import { CampaignAssetService } from './campaign-asset.service';
import { CampaignAssetUploadInterceptor } from '../../common/interceptors/campaign-asset-upload.interceptor';
import {
  CampaignAssetDeletedResponseDto,
  CampaignAssetRevisionQueryDto,
  CampaignAssetsResponseDto,
  CampaignAssetUploadedResponseDto,
  CampaignAssetVersionDto,
  ReorderCampaignAssetsDto,
  UploadCampaignAssetDto,
} from './dto/campaign-asset.dto';
import { ECampaignAssetKind } from '../../common/enum/campaign.enum';

@ApiTags('Brand-Campaign')
@ApiBearerAuth('access-token')
@Roles(ERole.BRAND)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('brand/campaigns/:campaignId')
export class CampaignAssetController {
  constructor(private readonly assets: CampaignAssetService) {}

  @Get('assets')
  @ApiOperation({ summary: 'List current assets and campaign version' })
  @ApiOkResponse({ type: CampaignAssetsResponseDto })
  list(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
  ) {
    return this.assets.list(request.user.id, campaignId);
  }

  @Post('assets')
  @UseInterceptors(CampaignAssetUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload or replace an asset; separate from text autosave',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'kind', 'expectedVersion'],
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string', enum: Object.values(ECampaignAssetKind) },
        expectedVersion: { type: 'integer', minimum: 1 },
        replaceAssetId: {
          type: 'string',
          format: 'uuid',
          description:
            'Existing asset of the same kind; retains id and position',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: CampaignAssetUploadedResponseDto })
  upload(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: UploadCampaignAssetDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assets.upload(request.user.id, campaignId, dto, file);
  }

  @Put('assets/order')
  @ApiOperation({
    summary: 'Reorder the complete list of one asset kind atomically',
  })
  @ApiOkResponse({ type: CampaignAssetsResponseDto })
  reorder(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Body() dto: ReorderCampaignAssetsDto,
  ) {
    return this.assets.reorder(request.user.id, campaignId, dto);
  }

  @Delete('assets/:assetId')
  @ApiOperation({
    summary: 'Delete a current asset; historical objects are retained',
  })
  @ApiOkResponse({ type: CampaignAssetDeletedResponseDto })
  delete(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query() dto: CampaignAssetVersionDto,
  ) {
    return this.assets.delete(
      request.user.id,
      campaignId,
      assetId,
      dto.expectedVersion,
    );
  }

  @Get('assets/:assetId')
  @ApiOperation({
    summary: 'Read current asset content with ownership authentication',
  })
  @ApiOkResponse({
    description: 'File stream',
    schema: { type: 'string', format: 'binary' },
  })
  async read(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.stream(
      await this.assets.read(request.user.id, campaignId, assetId),
      response,
    );
  }

  @Get('reviews/:submissionId/asset')
  @ApiOperation({
    summary: 'Read frozen revision content by kind and original position',
  })
  @ApiOkResponse({
    description: 'Historical file stream',
    schema: { type: 'string', format: 'binary' },
  })
  async readRevision(
    @Request() request: { user: AuthenticatedAccount },
    @Param('campaignId', ParseUUIDPipe) campaignId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Query() query: CampaignAssetRevisionQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    return this.stream(
      await this.assets.readRevision(
        request.user.id,
        campaignId,
        submissionId,
        query.kind,
        query.position,
      ),
      response,
    );
  }

  private stream(
    payload: {
      asset: {
        originalName: string | null;
        mimeType: string;
        sizeBytes: number;
      };
      streamResult: StorageStreamResult;
    },
    response: Response,
  ): StreamableFile {
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(payload.streamResult.stream as Readable, {
      type: payload.asset.mimeType,
      length: payload.asset.sizeBytes,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(payload.asset.originalName ?? 'asset').replace(/['()*]/g, (char) => '%' + char.charCodeAt(0).toString(16))}`,
    });
  }
}
