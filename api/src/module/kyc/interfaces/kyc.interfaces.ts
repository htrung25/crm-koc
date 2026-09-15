import { ERole } from 'src/common/enum/roles.enum';
import { EKycStatus } from 'src/common/enum/kyc.enum';
import { EKycRejectReason } from 'src/common/enum/kyc.enum';
import { KycDocument } from '../entities/kyc-document.entity';

/** Vai trò nộp KYC. Admin không nộp. */
export interface KycReviewCommand {
  status: EKycStatus;
  rejectReason?: EKycRejectReason;
  reviewNote?: string;
}

export interface DocumentStreamPayload {
  document: KycDocument;
  streamResult: import('src/common/services/storage.service').StorageStreamResult;
}
