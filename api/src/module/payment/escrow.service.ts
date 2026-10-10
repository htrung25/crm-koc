import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escrow } from './entities/escrow.entity';
import { WalletService } from './wallet.service';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { toCents } from '../../common/util/money.util';
import type { Collaboration } from '../collaboration/entities/collaboration.entity';

@Injectable()
export class EscrowService {
  constructor(
    @InjectRepository(Escrow)
    private readonly escrowRepository: Repository<Escrow>,
    private readonly walletService: WalletService,
  ) {}

  async shortfall(brandId: string, amount: string): Promise<bigint> {
    const missing =
      toCents(amount) -
      toCents(await this.walletService.availableBalance(brandId));
    return missing > 0n ? (missing + 99n) / 100n : 0n;
  }

  // Duyệt campaign: chuyển cash_budget từ ví brand vào ký quỹ.
  async lock(
    brandId: string,
    campaignId: string,
    amount: string,
  ): Promise<void> {
    const inserted = await this.escrowRepository
      .createQueryBuilder()
      .insert()
      .into(Escrow)
      .values({ campaignId, brandId, heldAmount: amount })
      .orIgnore()
      .returning('campaign_id')
      .execute();
    if ((inserted.raw as unknown[]).length === 0) {
      return;
    }
    if (!(await this.walletService.debit(brandId, amount, campaignId))) {
      throw this.insufficientBalance(amount);
    }
  }

  // Chốt giá thương lượng: delta > 0 brand trả thêm vào ký quỹ, < 0 hoàn lại.
  async adjust(collab: Collaboration, delta: bigint): Promise<void> {
    if (delta === 0n) return;
    const campaignId = await this.requireEscrow(collab);
    const amount = (delta < 0n ? -delta : delta).toString();
    if (delta > 0n) {
      if (
        !(await this.walletService.debit(collab.brandId, amount, campaignId))
      ) {
        throw this.insufficientBalance(amount);
      }
      await this.hold(campaignId, amount);
      return;
    }
    await this.release(campaignId, amount);
    await this.walletService.credit(collab.brandId, amount, { campaignId });
  }

  // Hợp tác huỷ: trả phần của nó từ ký quỹ về ví brand.
  async refund(collab: Collaboration): Promise<void> {
    const campaignId = await this.requireEscrow(collab);
    const price = this.priceOf(collab);
    await this.release(campaignId, price);
    await this.walletService.credit(collab.brandId, price, { campaignId });
  }

  // Hợp tác hoàn thành: chuyển agreedPrice từ ký quỹ sang ví creator.
  async payout(collab: Collaboration): Promise<void> {
    const price = this.priceOf(collab);
    const campaignId = await this.requireEscrow(collab);
    // false = đã trả ở lần COMPLETED trước (qua DISPUTED rồi quay lại).
    const credited = await this.walletService.creditEarning(
      collab.creatorId,
      collab.id,
      price,
    );
    if (credited) {
      await this.release(campaignId, price);
    }
  }

  // Khoá dòng ký quỹ tới hết transaction: hai hợp tác cùng campaign chi song
  // song thì xếp hàng thay vì cùng đọc một số dư.
  private async requireEscrow(collab: Collaboration): Promise<string> {
    const escrow = collab.campaignId
      ? await this.escrowRepository.findOne({
          where: { campaignId: collab.campaignId },
          lock: { mode: 'pessimistic_write' },
        })
      : null;
    if (!escrow) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.ESCROW_INSUFFICIENT,
        message: 'collaboration has no campaign escrow to pay from',
      });
    }
    return escrow.campaignId;
  }

  private priceOf(collab: Collaboration): string {
    if (!collab.agreedPrice || BigInt(collab.agreedPrice) <= 0n) {
      throw new UnprocessableEntityException(
        'collaboration has no agreed price',
      );
    }
    return collab.agreedPrice;
  }

  private async hold(campaignId: string, amount: string): Promise<void> {
    await this.escrowRepository
      .createQueryBuilder()
      .update(Escrow)
      .set({ heldAmount: () => 'held_amount + :amount' })
      .where('campaign_id = :campaignId')
      .setParameters({ campaignId, amount })
      .execute();
  }

  // Có điều kiện: chi quá phần còn giữ (nhiều hợp tác hơn số suất) bị chặn.
  private async release(campaignId: string, amount: string): Promise<void> {
    const released = await this.escrowRepository
      .createQueryBuilder()
      .update(Escrow)
      .set({ heldAmount: () => 'held_amount - :amount' })
      .where('campaign_id = :campaignId AND held_amount >= :amount')
      .setParameters({ campaignId, amount })
      .execute();
    if (released.affected !== 1) {
      throw new UnprocessableEntityException({
        businessCode: EBusinessCode.ESCROW_INSUFFICIENT,
        message: 'campaign escrow does not hold enough to cover this payment',
      });
    }
  }

  private insufficientBalance(amount: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      businessCode: EBusinessCode.CAMPAIGN_INSUFFICIENT_BALANCE,
      message: `brand wallet does not have ${amount} available`,
    });
  }
}
