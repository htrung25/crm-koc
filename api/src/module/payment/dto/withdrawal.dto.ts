import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';
import { WITHDRAWAL_AMOUNT_PATTERN } from '../constants/payment.constants';

/* Client chỉ chọn tài khoản nhận và số tiền. Phí, trạng thái, mã giao dịch và
 * thông tin ngân hàng đều do server điền, không nhận từ request. */
export class WithdrawalDto {
  @ApiProperty({ format: 'uuid', description: 'Bank account to receive money' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({
    example: '1000000',
    description:
      'Whole VND deducted from the wallet, fee included. Fee is rounded to whole VND.',
  })
  @IsString()
  @Matches(WITHDRAWAL_AMOUNT_PATTERN, {
    message: 'amount must be a whole number of VND',
  })
  amount: string;
}
