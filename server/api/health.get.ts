import { sql } from 'drizzle-orm'
import { useDatabase } from '../db/client'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    await useDatabase().execute(sql`select 1`)
    const integrations = { pakasir: Boolean(config.pakasirProjectSlug && config.pakasirApiKey), rajaOngkir: Boolean(config.rajaOngkirApiKey && config.rajaOngkirOriginId) }
    return { status: Object.values(integrations).every(Boolean) ? 'ready' : 'degraded', database: true, integrations }
  } catch { throw createError({ statusCode: 503, statusMessage: 'Database tidak tersedia' }) }
})
