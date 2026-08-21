import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Vết mỗi lần admin mở một tài liệu KYC.
 *
 * KHÔNG có quan hệ FK nào — giống session_events: log kiểm toán phải sống sót
 * khi tài khoản bị xoá và khi tài liệu bị xoá theo hạn lưu trữ. Watermark chỉ
 * có giá trị khi truy ngược được người đã xem.
 */
@Index('IDX_kyc_document_views_document_id', ['documentId'])
@Entity('kyc_document_views')
export class KycDocumentView {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'uuid' })
  submissionId: string;

  @Column({ type: 'uuid' })
  viewedBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  viewedAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;
}
