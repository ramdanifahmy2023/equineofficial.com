import { and, gte, lte } from 'drizzle-orm'
import { financialLedger } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`

export default defineEventHandler(async (event) => {
  await requireStaff(event, ['super_admin'])
  const query = getQuery(event)
  const from = typeof query.from === 'string' && query.from ? new Date(query.from) : null
  const to = typeof query.to === 'string' && query.to ? new Date(query.to) : null
  if (from && Number.isNaN(from.getTime())) throw createError({ statusCode: 400, statusMessage: 'Tanggal mulai tidak valid' })
  if (to && Number.isNaN(to.getTime())) throw createError({ statusCode: 400, statusMessage: 'Tanggal akhir tidak valid' })
  const filters = [from ? gte(financialLedger.recognizedAt, from) : undefined, to ? lte(financialLedger.recognizedAt, to) : undefined].filter(Boolean)
  const rows = await useDatabase().select().from(financialLedger).where(filters.length ? and(...filters) : undefined).orderBy(financialLedger.recognizedAt)
  if (query.format === 'csv') {
    setHeader(event, 'content-type', 'text/csv; charset=utf-8')
    setHeader(event, 'content-disposition', 'attachment; filename="financial-report.csv"')
    return ['order_id,category,amount,recognized_at', ...rows.map((row) => [row.orderId, row.category, row.amount, row.recognizedAt.toISOString()].map(csv).join(','))].join('\n')
  }
  const totals = rows.reduce<Record<string, number>>((result, row) => { result[row.category] = (result[row.category] || 0) + row.amount; return result }, {})
  return { rows, totals }
})
