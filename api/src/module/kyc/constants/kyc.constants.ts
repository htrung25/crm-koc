import { EKycDocumentType, EKycStatus } from '../../../common/enum/kyc.enum';
import { ERole } from '../../../common/enum/roles.enum';
import { KycTransitionMap } from '../types/kyc.types';

/** Enum là số nên thông điệp lỗi phải tự dịch, không thì FE nhận "3" trơ trọi. */
export const KYC_STATUS_LABEL: Record<EKycStatus, string> = {
  [EKycStatus.DRAFT]: 'draft',
  [EKycStatus.PENDING]: 'pending',
  [EKycStatus.MORE_INFO]: 'more_info',
  [EKycStatus.VERIFIED]: 'verified',
  [EKycStatus.REJECTED]: 'rejected',
  [EKycStatus.LOCKED]: 'locked',
  [EKycStatus.EXPIRED]: 'expired',
};

/** Trạng thái nằm TRONG partial unique index: mỗi (account, role) chỉ một. */
export const OPEN_KYC_STATUSES = [
  EKycStatus.DRAFT,
  EKycStatus.PENDING,
  EKycStatus.MORE_INFO,
];

/** Số lượt nộp tối đa. MORE_INFO không tính vào đây. */
export const MAX_KYC_ATTEMPTS = 3;

/** Giấy tờ bắt buộc theo vai trò — thiếu thì không cho chuyển sang PENDING. */
export const REQUIRED_DOCUMENTS: Record<
  ERole.BRAND | ERole.CREATOR,
  EKycDocumentType[]
> = {
  [ERole.BRAND]: [
    EKycDocumentType.BUSINESS_LICENSE,
    EKycDocumentType.TAX_CERTIFICATE,
  ],
  [ERole.CREATOR]: [
    EKycDocumentType.ID_CARD_FRONT,
    EKycDocumentType.ID_CARD_BACK,
    EKycDocumentType.PORTRAIT_WITH_ID,
  ],
};

/** Loại giấy tờ hợp lệ theo vai trò: brand không nộp CCCD và ngược lại. */
export const ALLOWED_DOCUMENTS_BY_ROLE = REQUIRED_DOCUMENTS;

export const KYC_LIST_FIELDS = [
  'id',
  'accountId',
  'role',
  'status',
  'attemptNo',
  'priority',
  'submittedAt',
  'reviewedAt',
  'reviewedBy',
  'rejectReason',
  'reviewNote',
  'createdAt',
  'updatedAt',
] as const;

export const KYC_SYSTEM_ACTOR = 'system' as const;

export const ALL_KYC_STATUSES = Object.values(EKycStatus).filter(
  (value): value is EKycStatus => typeof value === 'number',
);

export const KYC_TRANSITIONS: KycTransitionMap = {
  [EKycStatus.DRAFT]: {
    [EKycStatus.PENDING]: [ERole.BRAND, ERole.CREATOR],
  },
  [EKycStatus.PENDING]: {
    [EKycStatus.VERIFIED]: [ERole.ADMIN],
    [EKycStatus.MORE_INFO]: [ERole.ADMIN],
    [EKycStatus.REJECTED]: [ERole.ADMIN],
  },
  [EKycStatus.MORE_INFO]: {
    [EKycStatus.PENDING]: [ERole.BRAND, ERole.CREATOR],
  },
  [EKycStatus.VERIFIED]: {
    [EKycStatus.EXPIRED]: [ERole.ADMIN, KYC_SYSTEM_ACTOR],
  },
  [EKycStatus.REJECTED]: {},
  [EKycStatus.LOCKED]: {},
  [EKycStatus.EXPIRED]: {},
};
