CREATE TABLE IF NOT EXISTS "qr_challenges" (
	"jti" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"purpose" text NOT NULL,
	"context" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qr_challenges_user_expiry_idx" ON "qr_challenges" USING btree ("user_id", "expires_at");
