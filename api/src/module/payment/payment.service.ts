import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { PaymentDto } from './dto/payment.dto';
import { PublicRole } from '../auth/types/authenticated.types';
import { ECurency } from '../../common/enum/payment.enum';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async create(dto: PaymentDto, role: PublicRole, accountId: string) {
    const payment = this.paymentRepository.create({
      accountId: dto.accountId || accountId,
      orderId: dto.orderId,
      transactionId: dto.transactionId,
      amount: dto.amount,
      currency: ECurency.VND,
      paymentMethod: dto.paymentMethod,
      status: dto.status,
      payload: dto.payload,
    });
    await this.paymentRepository.save(payment);
    return payment;
  }

  async findAll(): Promise<Payment[]> {
    const data = await this.paymentRepository.find();
    return data;
  }
}
