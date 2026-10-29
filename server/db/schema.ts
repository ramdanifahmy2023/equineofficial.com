import { check, index, integer, jsonb, pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  material: text('material').notNull(),
  fit: text('fit').notNull(),
  image: text('image').notNull(),
  active: integer('active').notNull().default(1),
  archived: integer('archived').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id),
  color: text('color').notNull(),
  size: text('size').notNull(),
  sku: text('sku').notNull().unique(),
  price: integer('price').notNull(),
  costPrice: integer('cost_price').notNull().default(0),
  compareAtPrice: integer('compare_at_price'),
  stock: integer('stock').notNull().default(0),
  weightGrams: integer('weight_grams').notNull().default(500),
}, (table) => ({ identity: uniqueIndex('product_variant_identity').on(table.productId, table.color, table.size), stockCheck: check('variant_stock_nonnegative', sql`${table.stock} >= 0`) }))

export const customerUsers = pgTable('customer_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  phone: text('phone').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const customerSessions = pgTable('customer_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => customerUsers.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customerUsers.id),
  orderNumber: text('order_number').notNull().unique(),
  status: text('status').notNull().default('pending'),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  address: text('address').notNull(),
  destination: text('destination').notNull(),
  postalCode: text('postal_code').notNull(),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  voucherCode: text('voucher_code'),
  cancelledAt: timestamp('cancelled_at'),
  shippingCost: integer('shipping_cost').notNull(),
  total: integer('total').notNull(),
  shippingSnapshot: jsonb('shipping_snapshot').notNull(),
  trackingNumber: text('tracking_number'),
  paymentMethod: text('payment_method').notNull().default('online'),
  internalNote: text('internal_note'),
  claimedBy: uuid('claimed_by').references(() => staffUsers.id),
  claimedAt: timestamp('claimed_at'),
  packingChecklist: jsonb('packing_checklist'),
  packingCompletedAt: timestamp('packing_completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const codTransactions = pgTable('cod_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id).unique(),
  status: text('status').notNull().default('awaiting_confirmation'),
  confirmationDeadline: timestamp('confirmation_deadline').notNull(),
  confirmedAt: timestamp('confirmed_at'),
  collectedAt: timestamp('collected_at'),
  settledAt: timestamp('settled_at'),
  settlementReference: text('settlement_reference'),
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const shipmentEvents = pgTable('shipment_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  externalId: text('external_id').notNull(),
  status: text('status').notNull(),
  description: text('description').notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({ orderExternal: uniqueIndex('shipment_event_order_external').on(table.orderId, table.externalId), orderOccurred: index('shipment_event_order_occurred').on(table.orderId, table.occurredAt) }))

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  productId: uuid('product_id').notNull(),
  variantId: uuid('variant_id').notNull(),
  productName: text('product_name').notNull(),
  color: text('color').notNull(),
  size: text('size').notNull(),
  sku: text('sku').notNull(),
  unitPrice: integer('unit_price').notNull(),
  unitCost: integer('unit_cost').notNull().default(0),
  quantity: integer('quantity').notNull(),
})

export const returnCases = pgTable('return_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  customerId: uuid('customer_id').notNull().references(() => customerUsers.id),
  type: text('type').notNull(),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('requested'),
  trackingProof: text('tracking_proof'),
  inspectionResult: text('inspection_result'),
  replacementVariantId: uuid('replacement_variant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => staffUsers.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  reason: text('reason'),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  recipient: text('recipient').notNull(),
  status: text('status').notNull().default('requested'),
  requestedBy: uuid('requested_by').notNull().references(() => staffUsers.id),
  approvedBy: uuid('approved_by').references(() => staffUsers.id),
  approvedAt: timestamp('approved_at'),
  completedAt: timestamp('completed_at'),
  transferReference: text('transfer_reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  value: integer('value').notNull(),
  minimumSubtotal: integer('minimum_subtotal').notNull().default(0),
  maximumDiscount: integer('maximum_discount'),
  quota: integer('quota'),
  used: integer('used').notNull().default(0),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  active: integer('active').notNull().default(1),
})

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  provider: text('provider').notNull(),
  providerTransactionId: text('provider_transaction_id').notNull(),
  method: text('method').notNull(),
  amount: integer('amount').notNull(),
  fee: integer('fee').notNull().default(0),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({ orderProvider: uniqueIndex('payment_order_provider').on(table.orderId, table.provider), providerTransaction: uniqueIndex('payment_provider_transaction').on(table.provider, table.providerTransactionId) }))

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  provider: text('provider').notNull(),
  eventHash: text('event_hash').notNull().unique(),
  payload: jsonb('payload').notNull(),
  status: text('status').notNull(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const staffUsers = pgTable('staff_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  active: integer('active').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const staffSessions = pgTable('staff_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => staffUsers.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const inventoryMovements = pgTable('inventory_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull(),
  orderId: uuid('order_id'),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const financialLedger = pgTable('financial_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  category: text('category').notNull(),
  amount: integer('amount').notNull(),
  recognizedAt: timestamp('recognized_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({ orderCategory: uniqueIndex('financial_ledger_order_category').on(table.orderId, table.category), recognizedAtIndex: index('financial_ledger_recognized_at').on(table.recognizedAt) }))
