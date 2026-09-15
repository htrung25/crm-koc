import { ERole } from 'src/common/enum/roles.enum';
import { KYC_LIST_FIELDS, KYC_SYSTEM_ACTOR } from '../constants/kyc.constants';
import { KycSubmission } from '../entities/kyc-submission.entity';
import { EKycStatus } from 'src/common/enum/kyc.enum';

export type {
  DocumentStreamPayload,
  KycReviewCommand,
} from '../interfaces/kyc.interfaces';

export type KycRole = ERole.BRAND | ERole.CREATOR;
export type KycListItem = Pick<KycSubmission, (typeof KYC_LIST_FIELDS)[number]>;
export type KycOpeningPlan =
  | { kind: 'reuse'; submission: KycSubmission }
  | {
      kind: 'create';
      attemptNo: number;
      carryOverFromSubmissionId: string | null;
    };
export type KycTransitionActor = ERole | typeof KYC_SYSTEM_ACTOR;
export type KycTransitionMap = Record<
  EKycStatus,
  Partial<Record<EKycStatus, readonly KycTransitionActor[]>>
>;
