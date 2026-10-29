import { requireCustomer } from '../../utils/customer-auth'

export default defineEventHandler(async (event) => {
  const user = await requireCustomer(event)
  return { user: { id: user.id, email: user.email, name: user.name, phone: user.phone } }
})
