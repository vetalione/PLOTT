ALTER TABLE "wish" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wish" ADD COLUMN "tone_key" text;--> statement-breakpoint
ALTER TABLE "wish" ADD COLUMN "show_author" boolean DEFAULT true NOT NULL;