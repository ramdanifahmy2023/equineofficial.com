ALTER TABLE "payments" ADD COLUMN "provider_transaction_id" text;
--> statement-breakpoint
UPDATE "payments" SET "provider_transaction_id" = "orders"."order_number" FROM "orders" WHERE "payments"."order_id" = "orders"."id" AND "payments"."provider" = 'pakasir';
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "provider_transaction_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "payment_order_provider" ON "payments" USING btree ("order_id","provider");
--> statement-breakpoint
CREATE UNIQUE INDEX "payment_provider_transaction" ON "payments" USING btree ("provider","provider_transaction_id");
