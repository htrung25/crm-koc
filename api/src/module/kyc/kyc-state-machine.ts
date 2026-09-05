import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EBusinessCode } from '../../common/enum/business-code.enum';
import { EKycRejectReason, EKycStatus } from '../../common/enum/kyc.enum';
import { ERole } from '../../common/enum/roles.enum';
import {
  KYC_STATUS_LABEL,
  KycRole,
  MAX_KYC_ATTEMPTS,
  OPEN_KYC_STATUSES,
} from './constants/kyc.constants';
import { KycSubmission } from './entities/kyc-submission.entity';
import {
  KycOpeningPlan,
  KycReviewCommand,
  KycTransitionActor,
  ALL_KYC_STATUSES,
  KYC_TRANSITIONS,
} from './constants/kyc.constants';

export function planKycOpening(latest: KycSubmission | null): KycOpeningPlan {
  if (!latest) {
    return {
      kind: 'create',
      attemptNo: 1,
      carryOverFromSubmissionId: null,
    };
  }

  if (OPEN_KYC_STATUSES.includes(latest.status)) {
    return { kind: 'reuse', submission: latest };
  }

  if (
    latest.status === EKycStatus.LOCKED ||
    (latest.status === EKycStatus.REJECTED &&
      latest.attemptNo >= MAX_KYC_ATTEMPTS)
  ) {
    throw new ForbiddenException({
      businessCode: EBusinessCode.KYC_ATTEMPTS_EXHAUSTED,
      message: 'kyc attempts exhausted, contact support',
    });
  }

  if (latest.status === EKycStatus.VERIFIED) {
    throw new ConflictException('kyc is already verified for this role');
  }

  return {
    kind: 'create',
    attemptNo: latest.status === EKycStatus.REJECTED ? latest.attemptNo + 1 : 1,
    carryOverFromSubmissionId: latest.id,
  };
}

export function requireEditableKyc(
  latest: KycSubmission | null,
): KycSubmission {
  if (!latest || !OPEN_KYC_STATUSES.includes(latest.status)) {
    throw new NotFoundException('no open kyc submission');
  }
  if (latest.status === EKycStatus.PENDING) {
    throw new ConflictException('kyc submission is under review');
  }
  return latest;
}

export function submitKyc(
  submission: KycSubmission,
  actor: KycRole,
  occurredAt = new Date(),
): KycSubmission {
  assertKycTransition(submission.status, EKycStatus.PENDING, actor);
  submission.status = EKycStatus.PENDING;
  submission.submittedAt = occurredAt;
  return submission;
}

export function reviewKyc(
  submission: KycSubmission,
  command: KycReviewCommand,
  reviewerId: string,
  validityDays: number,
  occurredAt = new Date(),
): KycSubmission {
  assertKycTransition(submission.status, command.status, ERole.ADMIN);
  assertReviewCommand(command);

  const next =
    command.status === EKycStatus.REJECTED &&
    submission.attemptNo >= MAX_KYC_ATTEMPTS
      ? EKycStatus.LOCKED
      : command.status;

  submission.status = next;
  submission.reviewedAt = occurredAt;
  submission.reviewedBy = reviewerId;
  submission.rejectReason = command.rejectReason ?? null;
  submission.reviewNote = command.reviewNote ?? null;
  submission.notifiedAt = null;

  if (next === EKycStatus.VERIFIED) {
    const expiresAt = new Date(occurredAt);
    expiresAt.setDate(expiresAt.getDate() + validityDays);
    submission.expiresAt = expiresAt;
  }

  return submission;
}

export function assertKycTransition(
  current: EKycStatus,
  next: EKycStatus,
  actor: KycTransitionActor,
): void {
  const transitions = KYC_TRANSITIONS[current];
  const actors = transitions[next];
  const from = KYC_STATUS_LABEL[current];
  const to = KYC_STATUS_LABEL[next];

  if (!actors) {
    const allowed = ALL_KYC_STATUSES.filter(
      (status) => transitions[status],
    ).map((status) => KYC_STATUS_LABEL[status]);
    throw new BadRequestException(
      allowed.length === 0
        ? `${from} is a final status and cannot be changed`
        : `cannot change status from ${from} to ${to}; allowed: ${allowed.join(', ')}`,
    );
  }

  if (!actors.includes(actor)) {
    throw new ForbiddenException(
      `only ${actors.join(' or ')} can change status from ${from} to ${to}`,
    );
  }
}

/** Không export: chỉ reviewKyc() cần, để lộ ra ngoài là mời gọi gọi lẻ. */
function assertReviewCommand(command: KycReviewCommand): void {
  if (command.status === EKycStatus.MORE_INFO && !command.reviewNote?.trim()) {
    throw new BadRequestException(
      'reviewNote is required when asking for more info',
    );
  }

  if (command.status !== EKycStatus.REJECTED) {
    return;
  }
  if (command.rejectReason === undefined) {
    throw new BadRequestException('rejectReason is required when rejecting');
  }
  if (
    command.rejectReason === EKycRejectReason.OTHER &&
    !command.reviewNote?.trim()
  ) {
    throw new BadRequestException(
      "reviewNote is required when rejectReason is 'other'",
    );
  }
}
