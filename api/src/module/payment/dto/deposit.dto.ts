import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { DEPOSIT_AMOUNT_PATTERN } from '../constants/payment.constants';

export class DepositDto {
  @ApiProperty({ example: '500000', description: 'Amount in VND, integer' })
  @IsString()
  @Matches(DEPOSIT_AMOUNT_PATTERN, {
    message: 'amount must be a positive integer number of VND',
  })
  amount: string;
}
