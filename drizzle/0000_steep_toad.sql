CREATE TYPE "public"."attendance_status" AS ENUM('ENTRY', 'EXIT');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('GOOGLE', 'LOCAL');--> statement-breakpoint
CREATE TYPE "public"."borrowing_status" AS ENUM('AVAILABLE', 'BORROWED', 'DAMAGED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."borrowing_type" AS ENUM('BORROW', 'RETURN');--> statement-breakpoint
CREATE TYPE "public"."material_owner_type" AS ENUM('LAB', 'LECTURER');--> statement-breakpoint
CREATE TYPE "public"."research_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'ONGOING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."schedule_log_type" AS ENUM('REQUEST', 'RETURN', 'CANCEL');--> statement-breakpoint
CREATE TYPE "public"."tool_status" AS ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."waste_handling" AS ENUM('TAKE_HOME', 'LAB');--> statement-breakpoint
CREATE TYPE "public"."waste_phase" AS ENUM('SOLID', 'LIQUID', 'GAS');--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lecturers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"nip" varchar(30) NOT NULL,
	"whatsapp" varchar(30),
	CONSTRAINT "lecturers_nip_unique" UNIQUE("nip")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"nim" varchar(30) NOT NULL,
	"whatsapp" varchar(30),
	CONSTRAINT "students_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" text,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lab_managers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	CONSTRAINT "tool_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"inventory_code" varchar(100),
	"status" "tool_status" DEFAULT 'AVAILABLE',
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "tools_inventory_code_unique" UNIQUE("inventory_code")
);
--> statement-breakpoint
CREATE TABLE "research_labs" (
	"research_id" uuid NOT NULL,
	"lab_id" uuid NOT NULL,
	CONSTRAINT "research_labs_research_id_lab_id_pk" PRIMARY KEY("research_id","lab_id")
);
--> statement-breakpoint
CREATE TABLE "research_supervisors" (
	"research_id" uuid NOT NULL,
	"lecturer_id" uuid NOT NULL,
	CONSTRAINT "research_supervisors_research_id_lecturer_id_pk" PRIMARY KEY("research_id","lecturer_id")
);
--> statement-breakpoint
CREATE TABLE "research_tools" (
	"research_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	CONSTRAINT "research_tools_research_id_tool_id_pk" PRIMARY KEY("research_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "researches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "research_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"owner_type" "material_owner_type" NOT NULL,
	"lab_id" uuid,
	"lecturer_id" uuid,
	"quantity" numeric(15, 4) DEFAULT '0' NOT NULL,
	"unit" varchar(50) NOT NULL,
	"is_monitored" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "material_owner_check" CHECK (
        (
          "materials"."owner_type" = 'LAB'
          AND "materials"."lab_id" IS NOT NULL
          AND "materials"."lecturer_id" IS NULL
        )
        OR
        (
          "materials"."owner_type" = 'LECTURER'
          AND "materials"."lecturer_id" IS NOT NULL
          AND "materials"."lab_id" IS NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE "research_materials" (
	"research_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	CONSTRAINT "research_materials_research_id_material_id_pk" PRIMARY KEY("research_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "research_wastes" (
	"research_id" uuid NOT NULL,
	"waste_id" uuid NOT NULL,
	CONSTRAINT "research_wastes_research_id_waste_id_pk" PRIMARY KEY("research_id","waste_id")
);
--> statement-breakpoint
CREATE TABLE "wastes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phase" "waste_phase" NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '0' NOT NULL,
	"unit" varchar(50) NOT NULL,
	"handling" "waste_handling" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_application_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"research_id" uuid NOT NULL,
	"status" "research_status" NOT NULL,
	"comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "lab_attendance_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"research_id" uuid,
	"activity" text,
	"status" "attendance_status" NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"qr_token_id" uuid
);
--> statement-breakpoint
CREATE TABLE "tool_schedule_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"schedule_id" uuid,
	"time_start" timestamp with time zone,
	"time_end" timestamp with time zone,
	"type" "schedule_log_type" NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"research_id" uuid,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_borrowing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"research_id" uuid,
	"time" timestamp with time zone DEFAULT now() NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"type" "borrowing_type" NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "tool_borrowing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"research_id" uuid,
	"time" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "borrowing_status" NOT NULL,
	"type" "borrowing_type" NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_managers" ADD CONSTRAINT "lab_managers_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_managers" ADD CONSTRAINT "lab_managers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_category_id_tool_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tool_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_labs" ADD CONSTRAINT "research_labs_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_labs" ADD CONSTRAINT "research_labs_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_supervisors" ADD CONSTRAINT "research_supervisors_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_supervisors" ADD CONSTRAINT "research_supervisors_lecturer_id_lecturers_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_tools" ADD CONSTRAINT "research_tools_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_tools" ADD CONSTRAINT "research_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "researches" ADD CONSTRAINT "researches_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_lecturer_id_lecturers_id_fk" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_materials" ADD CONSTRAINT "research_materials_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_materials" ADD CONSTRAINT "research_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_wastes" ADD CONSTRAINT "research_wastes_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_wastes" ADD CONSTRAINT "research_wastes_waste_id_wastes_id_fk" FOREIGN KEY ("waste_id") REFERENCES "public"."wastes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_application_logs" ADD CONSTRAINT "research_application_logs_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_application_logs" ADD CONSTRAINT "research_application_logs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_attendance_logs" ADD CONSTRAINT "lab_attendance_logs_lab_id_labs_id_fk" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_attendance_logs" ADD CONSTRAINT "lab_attendance_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_attendance_logs" ADD CONSTRAINT "lab_attendance_logs_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedule_logs" ADD CONSTRAINT "tool_schedule_logs_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedule_logs" ADD CONSTRAINT "tool_schedule_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedule_logs" ADD CONSTRAINT "tool_schedule_logs_schedule_id_tool_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."tool_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedules" ADD CONSTRAINT "tool_schedules_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedules" ADD CONSTRAINT "tool_schedules_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_schedules" ADD CONSTRAINT "tool_schedules_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_borrowing_logs" ADD CONSTRAINT "material_borrowing_logs_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_borrowing_logs" ADD CONSTRAINT "material_borrowing_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_borrowing_logs" ADD CONSTRAINT "material_borrowing_logs_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_borrowing_logs" ADD CONSTRAINT "tool_borrowing_logs_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_borrowing_logs" ADD CONSTRAINT "tool_borrowing_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_borrowing_logs" ADD CONSTRAINT "tool_borrowing_logs_research_id_researches_id_fk" FOREIGN KEY ("research_id") REFERENCES "public"."researches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_provider_account_idx" ON "auth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lab_manager_unique_idx" ON "lab_managers" USING btree ("lab_id","user_id");
