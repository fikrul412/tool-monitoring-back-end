ALTER TYPE "public"."letter_status" ADD VALUE 'REJECTED';--> statement-breakpoint
ALTER TABLE "letter_applications" DROP CONSTRAINT "letter_applications_research_type_unique";--> statement-breakpoint
ALTER TABLE "letter_applications" ADD COLUMN "review_comments" text;
