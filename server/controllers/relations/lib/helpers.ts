import { getUserById } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'
import type { UserId } from '#types/user'

export async function validateUserExistance (userId: UserId) {
  try {
    const user = await getUserById(userId)
    if (user.type !== 'user') throw newError('invalid user type', 400, { userId, type: user.type })
  } catch (err) {
    if (err.statusCode === 404) throw newError('user not found', 404, { userId })
    else throw err
  }
}
