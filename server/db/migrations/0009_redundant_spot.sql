CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "claimed_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packing_checklist" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packing_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_staff_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_claimed_by_staff_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."staff_users"("id") ON DELETE no action ON UPDATE no action;