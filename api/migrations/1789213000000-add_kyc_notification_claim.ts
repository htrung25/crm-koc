import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycNotificationClaim1789213000000 implements MigrationInterface {
  name = 'AddKycNotificationClaim1789213000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        ADD COLUMN "notification_claim_token" uuid NULL,
        ADD COLUMN "notification_claim_until" timestamptz NULL,
        ADD CONSTRAINT "CHK_kyc_notification_claim_pair" CHECK (
          ("notification_claim_token" IS NULL) = ("notification_claim_until" IS NULL)
        )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kyc_submissions"
        DROP CONSTRAINT "CHK_kyc_notification_claim_pair",
        DROP COLUMN "notification_claim_until",
        DROP COLUMN "notification_claim_token"
    `);
  }
}
