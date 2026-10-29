import { randomBytes } from 'node:crypto'
import { useDatabase } from '../db/client'
import { requireCustomer } from '../utils/customer-auth'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { codTransactions, inventoryMovements, orderItems, orders, products, productVariants, vouchers } from '../db/schema'
import { findVoucher } from '../utils/voucher'
import { verifyQuote } from '../utils/quote'

export default defineEventHandler(async (event) => {
  const customer = await requireCustomer(event)
  const body = validateCreateOrder(await readBody(event))
  const quote = body.shipping.quoteToken ? verifyQuote(body.shipping.quoteToken) : null
  if (quote && (quote.id !== body.shipping.id || quote.courier !== body.shipping.courier || quote.service !== body.shipping.service || quote.price !== body.shipping.price || quote.destinationId !== body.shipping.destinationId)) throw createError({ statusCode: 409, statusMessage: 'Quote pengiriman berubah' })
  if (!quote && !import.meta.dev) throw createError({ statusCode: 400, statusMessage: 'Quote pengiriman wajib digunakan' })
  const variantIds = [...new Set(body.items.map((item) => item.variantId))]
  const db = useDatabase()
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(productVariants).innerJoin(products, eq(productVariants.productId, products.id)).where(and(inArray(productVariants.id, variantIds), eq(products.active, 1), eq(products.archived, 0))).for('update')
    if (rows.length !== variantIds.length) throw createError({ statusCode: 409, statusMessage: 'Produk atau varian berubah' })
    const requested = new Map(body.items.map((item) => [item.variantId, item.quantity]))
    for (const row of rows) if (row.product_variants.stock < (requested.get(row.product_variants.id) || 0)) throw createError({ statusCode: 409, statusMessage: `Stok ${row.products.name} tidak mencukupi` })
    const subtotal = rows.reduce((sum, row) => sum + row.product_variants.price * (requested.get(row.product_variants.id) || 0), 0)
    const voucherResult = body.voucherCode ? await findVoucher(tx, body.voucherCode, subtotal, true) : null
    const discount = voucherResult?.discount || 0
    const orderNumber = `EQ-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const paymentMethod = body.paymentMethod || 'online'
    const [order] = await tx.insert(orders).values({ customerId: customer.id, orderNumber, customerName: body.contact.name.trim(), customerEmail: body.contact.email.trim().toLowerCase(), customerPhone: body.contact.phone.trim(), address: body.contact.address.trim(), destination: body.contact.destination.trim(), postalCode: body.contact.postalCode, subtotal, discount, voucherCode: voucherResult?.voucher.code, shippingCost: body.shipping.price, total: subtotal - discount + body.shipping.price, shippingSnapshot: body.shipping, paymentMethod, status: paymentMethod === 'cod' ? 'cod_pending_confirmation' : 'pending' }).returning()
    if (paymentMethod === 'cod') await tx.insert(codTransactions).values({ orderId: order.id, amount: order.total, confirmationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) })
    if (voucherResult) await tx.update(vouchers).set({ used: sql`${vouchers.used} + 1` }).where(eq(vouchers.id, voucherResult.voucher.id))
    for (const row of rows) {
      const quantity = requested.get(row.product_variants.id) || 0
      await tx.insert(orderItems).values({ orderId: order.id, productId: row.products.id, variantId: row.product_variants.id, productName: row.products.name, color: row.product_variants.color, size: row.product_variants.size, sku: row.product_variants.sku, unitPrice: row.product_variants.price, unitCost: row.product_variants.costPrice, quantity })
      await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${quantity}` }).where(eq(productVariants.id, row.product_variants.id))
      await tx.insert(inventoryMovements).values({ variantId: row.product_variants.id, orderId: order.id, quantity: -quantity, reason: 'order_created' })
    }
    return { orderNumber, status: order.status, subtotal, shippingCost: order.shippingCost, total: order.total }
  })
})
