CREATE TYPE "public"."letter_type" AS ENUM('LAB_ACCESS', 'LAB_CLEARANCE');--> statement-breakpoint
CREATE TYPE "public"."letter_status" AS ENUM('SUBMITTED', 'RECEIVED');--> statement-breakpoint
CREATE TABLE "letter_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"type" "letter_type" NOT NULL,
	"status" "letter_status" DEFAULT 'SUBMITTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "letter_applications" ADD CONSTRAINT "letter_applications_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_applications" ADD CONSTRAINT "letter_applications_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letter_applications" ADD CONSTRAINT "letter_applications_research_type_unique" UNIQUE("research_id","type");
