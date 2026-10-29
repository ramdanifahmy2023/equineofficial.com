import { eq, sql } from 'drizzle-orm'
import { inventoryMovements, productVariants } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const variantId = getRouterParam(event, 'variantId') || ''
  const body = await readBody<{ amount?: number; reason?: string }>(event)
  if (!Number.isInteger(body.amount) || !body.amount || Math.abs(body.amount) > 10000 || !body.reason?.trim()) throw createError({ statusCode: 400, statusMessage: 'Penyesuaian stok tidak valid' })
  return useDatabase().transaction(async (tx) => {
    const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, variantId)).for('update')
    if (!variant || variant.stock + body.amount! < 0) throw createError({ statusCode: 409, statusMessage: 'Stok tidak mencukupi' })
    const [updated] = await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${body.amount!}` }).where(eq(productVariants.id, variantId)).returning()
    await tx.insert(inventoryMovements).values({ variantId, quantity: body.amount!, reason: `${body.reason!.trim()} by ${user.email}` })
    return updated
  })
})
