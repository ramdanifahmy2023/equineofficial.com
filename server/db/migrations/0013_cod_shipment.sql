ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT 'online' NOT NULL;
--> statement-breakpoint
CREATE TABLE "cod_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "status" text DEFAULT 'awaiting_confirmation' NOT NULL,
  "confirmation_deadline" timestamp NOT NULL,
  "confirmed_at" timestamp,
  "collected_at" timestamp,
  "settled_at" timestamp,
  "settlement_reference" text,
  "amount" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cod_transactions_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "shipment_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "external_id" text NOT NULL,
  "status" text NOT NULL,
  "description" text NOT NULL,
  "occurred_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cod_transactions" ADD CONSTRAINT "cod_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "shipment_event_order_external" ON "shipment_events" USING btree ("order_id","external_id");
--> statement-breakpoint
CREATE INDEX "shipment_event_order_occurred" ON "shipment_events" USING btree ("order_id","occurred_at");
