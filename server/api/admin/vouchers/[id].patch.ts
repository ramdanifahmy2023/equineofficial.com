import { eq } from 'drizzle-orm'
import { vouchers } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ active?: boolean }>(event)
  if (typeof body.active !== 'boolean') throw createError({ statusCode: 400, statusMessage: 'Status tidak valid' })
  const [voucher] = await useDatabase().update(vouchers).set({ active: body.active ? 1 : 0 }).where(eq(vouchers.id, id)).returning()
  if (!voucher) throw createError({ statusCode: 404, statusMessage: 'Voucher tidak ditemukan' })
  return voucher
})
