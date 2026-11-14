CREATE TYPE "public"."schedule_review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "students" ADD COLUMN "study_program" varchar(150);
ALTER TABLE "students" ADD COLUMN "address" text;
ALTER TABLE "tool_schedules" ADD COLUMN "review_status" "schedule_review_status";
UPDATE "tool_schedules" SET "review_status" = 'APPROVED';
ALTER TABLE "tool_schedules" ALTER COLUMN "review_status" SET DEFAULT 'PENDING';
ALTER TABLE "tool_schedules" ALTER COLUMN "review_status" SET NOT NULL;
CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "password_reset_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");
CREATE TABLE "research_clearance_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "research_id" uuid NOT NULL UNIQUE REFERENCES "researches"("id"),
  "material_usage" jsonb NOT NULL,
  "equipment_conditions" jsonb NOT NULL,
  "waste_handling" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
