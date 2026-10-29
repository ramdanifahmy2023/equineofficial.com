import { and, eq, gt, isNull, lt, or } from 'drizzle-orm'
import { vouchers } from '../db/schema'

export const findVoucher = async (db: any, code: string, subtotal: number, lock = false) => {
  const query = db.select().from(vouchers).where(and(eq(vouchers.code, code.trim().toUpperCase()), eq(vouchers.active, 1), lt(vouchers.startsAt, new Date()), gt(vouchers.endsAt, new Date()), or(isNull(vouchers.quota), gt(vouchers.quota, vouchers.used))))
  const [voucher] = lock ? await query.for('update') : await query.limit(1)
  if (!voucher || subtotal < voucher.minimumSubtotal) throw createError({ statusCode: 400, statusMessage: 'Voucher tidak valid atau syarat belum terpenuhi' })
  const raw = voucher.type === 'percentage' ? Math.floor(subtotal * voucher.value / 100) : voucher.value
  return { voucher, discount: Math.min(subtotal, voucher.maximumDiscount ? Math.min(raw, voucher.maximumDiscount) : raw) }
}
