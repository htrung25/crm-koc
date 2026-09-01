import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ECategoryPolicy } from '../../../common/enum/campaign.enum';

@Index('UQ_campaign_categories_name', ['name'], { unique: true })
@Entity('campaign_categories')
export class CampaignCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 32, default: ECategoryPolicy.ALLOWED })
  policy: ECategoryPolicy;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
