import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EKycDocumentType } from '../../../common/enum/kyc.enum';

@Index('UQ_kyc_documents_submission_type', ['submissionId', 'docType'], {
  unique: true,
})
@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  submissionId: string;

  @Column({ type: 'smallint' })
  docType: EKycDocumentType;

  /** Khoá trong R2, sinh ngẫu nhiên: không đoán được từ id hồ sơ. */
  @Column({ type: 'text' })
  storageKey: string;

  /** Tên người dùng đặt, CHỈ để hiển thị. Không bao giờ dùng làm đường dẫn. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  originalName: string | null;

  /** Lấy từ magic bytes, không tin đuôi tên lẫn Content-Type của client. */
  @Column({ type: 'varchar', length: 64 })
  mimeType: string;

  @Column({ type: 'integer' })
  sizeBytes: number;

  /** SHA-256, phát hiện người dùng nộp lại đúng file vừa bị từ chối. */
  @Column({ type: 'char', length: 64, nullable: true })
  checksum: string | null;

  /** Khác null = nội dung đã xoá theo hạn lưu trữ, metadata vẫn còn. */
  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
