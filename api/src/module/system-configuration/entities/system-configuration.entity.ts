import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ESystemConfig } from '../constants/system-config.enum';

@Index('IDX_system_configurations_group', ['group'])
@Entity('system_configurations')
export class SystemConfiguration {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  key: string;

  /** Luôn là text; `type` cho biết cách đọc. */
  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'smallint' })
  type: ESystemConfig;

  @Column({ type: 'varchar', length: 64 })
  group: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** null khi admin sửa nó đã bị xoá, hoặc dòng do migration gieo. */
  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
