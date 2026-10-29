import { eq } from 'drizzle-orm'
import { products } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const productId = getRouterParam(event, 'productId') || ''
  const body = await readBody<{ active?: boolean; archived?: boolean }>(event)
  if (typeof body.active !== 'boolean' && typeof body.archived !== 'boolean') throw createError({ statusCode: 400, statusMessage: 'Status tidak valid' })
  const values = { ...(typeof body.active === 'boolean' ? { active: body.active ? 1 : 0 } : {}), ...(typeof body.archived === 'boolean' ? { archived: body.archived ? 1 : 0 } : {}), updatedAt: new Date() }
  const [updated] = await useDatabase().update(products).set(values).where(eq(products.id, productId)).returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
  return updated
})
