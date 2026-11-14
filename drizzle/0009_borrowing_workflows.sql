ALTER TYPE "public"."borrowing_status" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "public"."borrowing_status" ADD VALUE IF NOT EXISTS 'REJECTED';
CREATE TYPE "public"."material_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "material_borrowing_logs" ADD COLUMN "approval_status" "material_request_status";
UPDATE "material_borrowing_logs" SET "approval_status" = 'APPROVED';
ALTER TABLE "material_borrowing_logs" ALTER COLUMN "approval_status" SET DEFAULT 'PENDING';
ALTER TABLE "material_borrowing_logs" ALTER COLUMN "approval_status" SET NOT NULL;
ALTER TABLE "material_borrowing_logs" ADD COLUMN "review_comments" text;
ALTER TABLE "tool_schedules" ADD COLUMN "location" text;
