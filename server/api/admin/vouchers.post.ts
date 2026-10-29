import { useDatabase } from '../../db/client'
import { vouchers } from '../../db/schema'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const body = await readBody<any>(event)
  if (!body.code?.trim() || !['fixed', 'percentage'].includes(body.type) || !Number.isInteger(body.value) || body.value <= 0 || !body.startsAt || !body.endsAt) throw createError({ statusCode: 400, statusMessage: 'Data voucher tidak valid' })
  const [voucher] = await useDatabase().insert(vouchers).values({ code: body.code.trim().toUpperCase(), type: body.type, value: body.value, minimumSubtotal: body.minimumSubtotal || 0, maximumDiscount: body.maximumDiscount || null, quota: body.quota || null, startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt) }).returning()
  return voucher
})
