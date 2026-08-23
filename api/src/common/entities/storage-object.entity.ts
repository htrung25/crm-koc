import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EStorageObjectState } from '../enum/storage-object-state.enum';

/** Bảng cắt ngang: theo dõi vòng đời mọi object trên R2 để sweep dọn tất định. */
@Entity('storage_objects')
export class StorageObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  storageKey: string;

  @Column({ type: 'smallint' })
  state: EStorageObjectState;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
