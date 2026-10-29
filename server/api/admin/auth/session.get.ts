import { requireStaff } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireStaff(event)
  return { user: { name: user.name, email: user.email, role: user.role } }
})
