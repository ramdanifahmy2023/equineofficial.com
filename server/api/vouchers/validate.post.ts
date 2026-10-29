import { findVoucher } from '../../utils/voucher'
import { useDatabase } from '../../db/client'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ code?: string; subtotal?: number }>(event)
  if (!body.code || !Number.isInteger(body.subtotal) || body.subtotal! < 0) throw createError({ statusCode: 400, statusMessage: 'Voucher tidak valid' })
  const result = await findVoucher(useDatabase(), body.code, body.subtotal!)
  return { code: result.voucher.code, discount: result.discount }
})
