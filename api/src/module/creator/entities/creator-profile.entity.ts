import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthEntity } from '../../auth/entities/auth.entity';
import { ECreatorContent } from '../../../common/enum/creator-content.enum';

@Entity('creator_profiles')
export class CreatorProfile {
  @PrimaryColumn({ type: 'uuid' })
  accountId: string;

  @OneToOne(() => AuthEntity, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: AuthEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName: string | null;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'smallint', nullable: true })
  gender: number | null;

  @Index()
  @Column({ type: 'varchar', length: 128, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  contentCategories: ECreatorContent[];

  @Column({ type: 'text', nullable: true })
  portfolioUrl: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Asia/Ho_Chi_Minh' })
  timezone: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
