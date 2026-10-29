import { desc } from 'drizzle-orm'
import { vouchers } from '../../db/schema'
import { useDatabase } from '../../db/client'
import { requireStaff } from '../../utils/auth'

export default defineEventHandler(async (event) => { await requireStaff(event, ['super_admin']); return useDatabase().select().from(vouchers).orderBy(desc(vouchers.startsAt)) })
