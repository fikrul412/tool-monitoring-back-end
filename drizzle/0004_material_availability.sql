ALTER TABLE "materials" DROP COLUMN "is_monitored";
ALTER TABLE "materials" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;
