import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
