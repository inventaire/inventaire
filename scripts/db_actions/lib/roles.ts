import { addUserRole, removeUserRole } from '#controllers/user/lib/user'
import { assertString } from '#lib/utils/assert_types'
import { assertUserRole } from '#models/user'
import { logErrorAndExit, logSuccessAndExit } from '#scripts/scripts_utils'

export async function updateUserRole (action: unknown, userId: unknown, role: unknown) {
  assertString(userId)
  assertUserRole(role)

  if (action === 'add') {
    await addUserRole(userId, role)
    .then(logSuccessAndExit.bind(null, `Role ${action}`))
    .catch(logErrorAndExit.bind(null, `Role ${action} err`))
  } else if (action === 'remove') {
    await removeUserRole(userId, role)
    .then(logSuccessAndExit.bind(null, `Role ${action}`))
    .catch(logErrorAndExit.bind(null, `Role ${action} err`))
  } else {
    logErrorAndExit(`Unknown action: ${action}`)
  }
}
