import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, EntityManager, Not } from 'typeorm';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { ECampaignAssetKind } from '../../common/enum/campaign.enum';
import { StorageObject } from '../../common/entities/storage-object.entity';
import { EStorageObjectState } from '../../common/enum/storage-object-state.enum';
import { StorageLedgerService } from '../../common/services/storage-ledger.service';
import { StorageService } from '../../common/services/storage.service';
import { inspectFile } from '../../common/util/file-inspect.util';
import { SystemConfigurationService } from '../system-configuration/system-configuration.service';
import {
  CAMPAIGN_CONFIG_KEY,
  EDITABLE_CAMPAIGN_STATUSES,
} from './constants/campaign.constants';
import { Campaign } from './entities/campaign.entity';
import { CampaignAsset } from './entities/campaign-asset.entity';
import { CampaignReviewSubmission } from './entities/campaign-review-submission.entity';
import {
  CampaignAssetResponseDto,
  CampaignAssetsResponseDto,
  CampaignAssetUploadedResponseDto,
  ReorderCampaignAssetsDto,
  UploadCampaignAssetDto,
} from './dto/campaign-asset.dto';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class CampaignAssetService {
  private readonly logger = new Logger(CampaignAssetService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
    private readonly ledger: StorageLedgerService,
    private readonly config: SystemConfigurationService,
  ) {}

  async maxUploadBytes(): Promise<number> {
    const limit = await this.config.getNumber(
      CAMPAIGN_CONFIG_KEY.assetMaxBytes,
    );
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 2147483647) {
      throw new ServiceUnavailableException(
        'campaign.asset_max_bytes must be a positive integer <= 2147483647',
      );
    }
    return limit;
  }

  async list(
    brandId: string,
    campaignId: string,
  ): Promise<CampaignAssetsResponseDto> {
    // Keep version and the list from the same committed state.
    return this.dataSource.transaction(async (manager) => {
      const campaign = await this.findCampaign(
        manager,
        brandId,
        campaignId,
        'pessimistic_read',
      );
      return this.listResult(manager, campaign);
    });
  }

  async upload(
    brandId: string,
    campaignId: string,
    dto: UploadCampaignAssetDto,
    file: Express.Multer.File,
  ): Promise<CampaignAssetUploadedResponseDto> {
    if (!file?.buffer) throw new BadRequestException('file is required');
    const campaign = await this.findCampaign(
      this.dataSource.manager,
      brandId,
      campaignId,
    );
    this.assertEditable(campaign, dto.expectedVersion);
    if (dto.replaceAssetId)
      await this.findAsset(
        this.dataSource.manager,
        campaignId,
        dto.replaceAssetId,
        dto.kind,
      );
    const allowed =
      dto.kind === ECampaignAssetKind.PRODUCT_IMAGE
        ? IMAGE_MIMES
        : [...IMAGE_MIMES, 'application/pdf'];
    if (!Object.values(ECampaignAssetKind).includes(dto.kind))
      throw new BadRequestException('invalid asset kind');
    const inspected = await inspectFile(
      file.buffer,
      await this.maxUploadBytes(),
      allowed,
    );
    const key = this.storage.generateKey('campaign/assets/');
    await this.ledger.markPending(key);
    try {
      // No PostgreSQL transaction held during object storage I/O.
      await this.storage.put(key, file.buffer, inspected.mimeType);
      return await this.dataSource.transaction(async (manager) => {
        const current = await this.findCampaign(
          manager,
          brandId,
          campaignId,
          'pessimistic_write',
        );
        this.assertEditable(current, dto.expectedVersion);
        const repo = manager.getRepository(CampaignAsset);
        const old = dto.replaceAssetId
          ? await this.findAsset(
              manager,
              campaignId,
              dto.replaceAssetId,
              dto.kind,
            )
          : null;
        const last = old
          ? null
          : await repo.findOne({
              where: { campaignId, kind: dto.kind },
              order: { position: 'DESC' },
            });
        const position = old?.position ?? (last?.position ?? 0) + 1;
        if (position > 32767)
          throw new UnprocessableEntityException(
            'asset position limit reached; reorder or delete assets first',
          );
        await this.ledger.linkPending(key, manager);
        const asset = await repo.save(
          repo.create({
            ...(old ? { id: old.id } : {}),
            campaignId,
            kind: dto.kind,
            position,
            storageKey: key,
            originalName: this.safeOriginalName(file.originalname),
            ...inspected,
          }),
        );
        if (old) await this.retire(manager, campaignId, old.storageKey);
        const version = await this.bumpVersion(manager, current);
        return { version, asset: this.metadata(asset) };
      });
    } catch (error) {
      // The PUT may finish after GC has claimed the original pending row.
      // A fresh ledger id prevents that old sweep from erasing this cleanup intent.
      try {
        await this.dataSource.transaction(async (manager) => {
          const repo = manager.getRepository(StorageObject);
          const row = await repo.findOne({
            where: { storageKey: key },
            lock: { mode: 'pessimistic_write' },
          });
          if (row?.state === EStorageObjectState.LINKED) return;
          await repo.delete({
            storageKey: key,
            state: Not(EStorageObjectState.LINKED),
          });
          await this.ledger.markGarbage(key, manager);
        });
      } catch (cleanupError) {
        this.logger.error(
          `Failed to register abandoned campaign upload ${key}`,
          cleanupError instanceof Error ? cleanupError.stack : undefined,
        );
      }
      throw error;
    }
  }

  async delete(
    brandId: string,
    campaignId: string,
    assetId: string,
    expectedVersion: number,
  ): Promise<{ version: number }> {
    return this.dataSource.transaction(async (manager) => {
      const campaign = await this.findCampaign(
        manager,
        brandId,
        campaignId,
        'pessimistic_write',
      );
      this.assertEditable(campaign, expectedVersion);
      const asset = await this.findAsset(manager, campaignId, assetId);
      await manager
        .getRepository(CampaignAsset)
        .delete({ id: assetId, campaignId });
      await this.retire(manager, campaignId, asset.storageKey);
      return { version: await this.bumpVersion(manager, campaign) };
    });
  }

  async reorder(
    brandId: string,
    campaignId: string,
    dto: ReorderCampaignAssetsDto,
  ): Promise<CampaignAssetsResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const campaign = await this.findCampaign(
        manager,
        brandId,
        campaignId,
        'pessimistic_write',
      );
      this.assertEditable(campaign, dto.expectedVersion);
      const repo = manager.getRepository(CampaignAsset);
      const assets = await repo.find({ where: { campaignId, kind: dto.kind } });
      const ids = new Set(assets.map((asset) => asset.id));
      if (
        dto.assetIds.length !== ids.size ||
        new Set(dto.assetIds).size !== ids.size ||
        dto.assetIds.some((id) => !ids.has(id))
      ) {
        throw new BadRequestException(
          'assetIds must contain every current asset of this kind exactly once',
        );
      }
      await manager.query(
        'SET CONSTRAINTS "UQ_campaign_assets_position" DEFERRED',
      );
      for (const [index, id] of dto.assetIds.entries()) {
        await repo.update(
          { id, campaignId, kind: dto.kind },
          { position: index + 1 },
        );
      }
      await manager.query(
        'SET CONSTRAINTS "UQ_campaign_assets_position" IMMEDIATE',
      );
      campaign.version = await this.bumpVersion(manager, campaign);
      return this.listResult(manager, campaign);
    });
  }

  async read(brandId: string, campaignId: string, assetId: string) {
    await this.findCampaign(this.dataSource.manager, brandId, campaignId);
    const asset = await this.findAsset(
      this.dataSource.manager,
      campaignId,
      assetId,
    );
    return {
      asset,
      streamResult: await this.storage.getStream(asset.storageKey),
    };
  }

  async readRevision(
    brandId: string,
    campaignId: string,
    submissionId: string,
    kind: ECampaignAssetKind,
    position: number,
  ) {
    await this.findCampaign(this.dataSource.manager, brandId, campaignId);
    const submission = await this.dataSource
      .getRepository(CampaignReviewSubmission)
      .findOneBy({ id: submissionId, campaignId });
    const asset = submission?.snapshot.assets.find(
      (item) => item.kind === kind && item.position === position,
    );
    if (
      !asset ||
      typeof asset.storageKey !== 'string' ||
      typeof asset.mimeType !== 'string' ||
      typeof asset.sizeBytes !== 'number'
    ) {
      throw new NotFoundException('revision asset does not exist');
    }
    return {
      asset: {
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        originalName:
          typeof asset.originalName === 'string' ? asset.originalName : null,
      },
      streamResult: await this.storage.getStream(asset.storageKey),
    };
  }

  private async retire(
    manager: EntityManager,
    campaignId: string,
    key: string,
  ): Promise<void> {
    const hasHistory = await manager
      .getRepository(CampaignReviewSubmission)
      .existsBy({ campaignId });
    if (!hasHistory) await this.ledger.markGarbage(key, manager);
  }

  private async findCampaign(
    manager: EntityManager,
    brandId: string,
    id: string,
    lock?: 'pessimistic_read' | 'pessimistic_write',
  ): Promise<Campaign> {
    const campaign = await manager.getRepository(Campaign).findOne({
      where: { id, brandId },
      ...(lock ? { lock: { mode: lock } } : {}),
    });
    if (!campaign) throw new NotFoundException('campaign does not exist');
    return campaign;
  }

  private async findAsset(
    manager: EntityManager,
    campaignId: string,
    id: string,
    kind?: ECampaignAssetKind,
  ): Promise<CampaignAsset> {
    const asset = await manager
      .getRepository(CampaignAsset)
      .findOneBy({ id, campaignId, ...(kind ? { kind } : {}) });
    if (!asset) throw new NotFoundException('campaign asset does not exist');
    return asset;
  }

  private assertEditable(campaign: Campaign, expectedVersion: number): void {
    if (campaign.version !== expectedVersion)
      throw new ConflictException({
        businessCode: EBusinessCode.CAMPAIGN_VERSION_CONFLICT,
        message: 'campaign version has changed',
        version: campaign.version,
      });
    if (!EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status))
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.CAMPAIGN_INVALID_TRANSITION,
        message: 'campaign cannot be edited in its current state',
        status: campaign.status,
        version: campaign.version,
      });
  }

  private async bumpVersion(
    manager: EntityManager,
    campaign: Campaign,
  ): Promise<number> {
    const result = await manager
      .getRepository(Campaign)
      .update(
        { id: campaign.id, version: campaign.version },
        { version: campaign.version + 1 },
      );
    if (result.affected !== 1)
      throw new ConflictException('campaign version has changed');
    return campaign.version + 1;
  }

  private metadata(asset: CampaignAsset): CampaignAssetResponseDto {
    return {
      id: asset.id,
      kind: asset.kind,
      position: asset.position,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
    };
  }

  private async listResult(
    manager: EntityManager,
    campaign: Campaign,
  ): Promise<CampaignAssetsResponseDto> {
    const assets = await manager.getRepository(CampaignAsset).find({
      where: { campaignId: campaign.id },
      order: { kind: 'ASC', position: 'ASC' },
    });
    return {
      version: campaign.version,
      assets: assets.map((asset) => this.metadata(asset)),
    };
  }

  private safeOriginalName(name: string): string | null {
    return (
      name
        // Filenames must not carry HTTP control characters.
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .split(/[\\/]/)
        .pop()
        ?.slice(0, 255) || null
    );
  }
}
