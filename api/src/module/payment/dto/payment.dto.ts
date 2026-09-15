import { EPaymentMethod, EPaymentStatus } from 'src/common/enum/payment.enum';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  IsObject,
} from 'class-validator';

export class PaymentDto {
  @IsString()
  @IsOptional()
  accountId: string;

  @IsString()
  @IsOptional()
  orderId: string;

  @IsString()
  transactionId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency: string;

  @IsEnum(EPaymentMethod)
  paymentMethod: EPaymentMethod;

  @IsEnum(EPaymentStatus)
  status: EPaymentStatus;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
