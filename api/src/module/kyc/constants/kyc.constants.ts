import { EKycDocumentType, EKycStatus } from '../../../common/enum/kyc.enum';
import { ERole } from '../../../common/enum/roles.enum';
import { KycSubmission } from '../entities/kyc-submission.entity';

/** Enum số nên Object.values trả cả tên lẫn số; lọc lấy phần số có kiểu. */
export const ALL_KYC_STATUSES = Object.values(EKycStatus).filter(
  (value): value is EKycStatus => typeof value === 'number',
);

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

/*Chuyển trạng thái hợp lệ + ai được bấm */
export const KYC_TRANSITION_ACTORS: Record<
  EKycStatus,
  Partial<Record<EKycStatus, ERole[]>>
> = {
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
    // Giấy tờ có hạn, và gian lận lộ ra sau khi duyệt.
    [EKycStatus.EXPIRED]: [ERole.ADMIN],
  },
  [EKycStatus.REJECTED]: {
    [EKycStatus.PENDING]: [ERole.BRAND, ERole.CREATOR],
  },
  [EKycStatus.LOCKED]: {},
  [EKycStatus.EXPIRED]: {
    [EKycStatus.PENDING]: [ERole.BRAND, ERole.CREATOR],
  },
};

/* Chuyển nào sinh dòng MỚI, chuyển nào sửa tại chỗ.*/
export const RESUBMIT_FROM_STATUSES = [EKycStatus.REJECTED, EKycStatus.EXPIRED];

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

/** Vai trò nộp KYC. Admin không nộp. */
export type KycRole = ERole.BRAND | ERole.CREATOR;

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

export type KycListItem = Pick<KycSubmission, (typeof KYC_LIST_FIELDS)[number]>;
