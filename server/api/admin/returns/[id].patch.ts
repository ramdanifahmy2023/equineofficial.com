import { eq } from 'drizzle-orm'
import { auditEvents, returnCases } from '../../../db/schema'
import { useDatabase } from '../../../db/client'
import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody<{ status?: string; inspectionResult?: string; trackingProof?: string; replacementVariantId?: string }>(event)
  if (!['approved', 'rejected', 'received', 'completed'].includes(body.status || '')) throw createError({ statusCode: 400, statusMessage: 'Status retur tidak valid' })
  return useDatabase().transaction(async (tx) => {
    const [current] = await tx.select().from(returnCases).where(eq(returnCases.id, id)).for('update')
    if (!current) throw createError({ statusCode: 404, statusMessage: 'Kasus tidak ditemukan' })
    const [updated] = await tx.update(returnCases).set({ status: body.status!, inspectionResult: body.inspectionResult?.trim() || current.inspectionResult, trackingProof: body.trackingProof?.trim() || current.trackingProof, replacementVariantId: body.replacementVariantId || current.replacementVariantId, updatedAt: new Date() }).where(eq(returnCases.id, id)).returning()
    await tx.insert(auditEvents).values({ actorId: user.id, entityType: 'return', entityId: id, action: 'status_updated', before: { status: current.status }, after: { status: updated.status, inspectionResult: updated.inspectionResult } })
    return updated
  })
})
