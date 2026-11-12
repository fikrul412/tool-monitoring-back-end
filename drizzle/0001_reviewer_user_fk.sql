ALTER TABLE "research_application_logs" DROP CONSTRAINT IF EXISTS "research_application_logs_reviewed_by_lecturers_id_fk";--> statement-breakpoint
ALTER TABLE "research_application_logs" DROP CONSTRAINT IF EXISTS "research_application_logs_reviewed_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "research_application_logs" ADD CONSTRAINT "research_application_logs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
