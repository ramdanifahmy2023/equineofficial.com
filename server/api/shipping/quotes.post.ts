import { calculateShipping } from '../../utils/shipping'
import { signQuote } from '../../utils/quote'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ destinationId?: string; weight?: number; courier?: string }>(event)
  const quotes: any[] = await calculateShipping(body.destinationId || '', body.weight || 0, body.courier || '')
  return quotes.map((item) => {
    const quote = { id: `${item.code || body.courier}-${item.service}`, courier: item.name || item.code || body.courier, service: item.service, etd: item.etd, price: Number(item.cost), destinationId: body.destinationId }
    return { ...quote, quoteToken: signQuote(quote) }
  })
})
