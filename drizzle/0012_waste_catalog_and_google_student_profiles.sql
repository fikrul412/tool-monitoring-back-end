CREATE TYPE "public"."waste_option_type" AS ENUM('CATEGORY', 'UNIT', 'PHASE', 'HANDLING');
CREATE TABLE "waste_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" "waste_option_type" NOT NULL,
  "value" varchar(150) NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "waste_option_type_value_idx" ON "waste_options" USING btree ("type", "value");
ALTER TABLE "wastes" ALTER COLUMN "phase" TYPE varchar(100) USING "phase"::text;
ALTER TABLE "wastes" ALTER COLUMN "handling" TYPE varchar(150) USING "handling"::text;
ALTER TABLE "wastes" ADD COLUMN "clearance_report_id" uuid REFERENCES "research_clearance_reports"("id") ON DELETE CASCADE;
ALTER TABLE "students" ALTER COLUMN "nim" DROP NOT NULL;
INSERT INTO "students" ("id", "name", "nim")
SELECT u."id", COALESCE(NULLIF(split_part(u."email", '@', 1), ''), 'Student'), NULL
FROM "users" u LEFT JOIN "students" s ON s."id" = u."id"
WHERE u."role" = 'STUDENT' AND s."id" IS NULL;
INSERT INTO "waste_options" ("type", "value") VALUES
  ('CATEGORY', 'Limbah bahan kimia'), ('CATEGORY', 'Limbah biologis'), ('CATEGORY', 'Kaca'), ('CATEGORY', 'Benda tajam'), ('CATEGORY', 'Plastik'), ('CATEGORY', 'Kertas'),
  ('UNIT', 'g'), ('UNIT', 'kg'), ('UNIT', 'mL'), ('UNIT', 'L'), ('UNIT', 'unit'),
  ('PHASE', 'Padat'), ('PHASE', 'Cair'), ('PHASE', 'Gas'),
  ('HANDLING', 'Disimpan di lab'), ('HANDLING', 'Diolah di lab'), ('HANDLING', 'Didaur ulang'), ('HANDLING', 'Dibawa pulang'), ('HANDLING', 'Diserahkan ke pihak ketiga');
INSERT INTO "wastes" ("clearance_report_id", "name", "phase", "quantity", "unit", "handling", "description", "created_at")
SELECT r."id", report."name", report."phase", COALESCE(report."quantity", '0'), COALESCE(report."unit", 'unit'), report."handling", report."notes", r."created_at"
FROM "research_clearance_reports" r
CROSS JOIN LATERAL jsonb_to_recordset(r."waste_handling") AS report("name" text, "phase" text, "quantity" numeric, "unit" text, "handling" text, "notes" text);
INSERT INTO "research_wastes" ("research_id", "waste_id")
SELECT r."research_id", w."id" FROM "wastes" w INNER JOIN "research_clearance_reports" r ON r."id" = w."clearance_report_id";
