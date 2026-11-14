ALTER TABLE "lab_attendance_logs" ALTER COLUMN "student_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lab_attendance_logs" ADD COLUMN "lecturer_id" uuid;--> statement-breakpoint
ALTER TABLE "lab_attendance_logs" ADD CONSTRAINT "lab_attendance_logs_lecturer_id_lecturers_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE no action ON UPDATE no action;
