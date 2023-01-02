#!/usr/bin/env node
import { addRole, removeRole } from '#controllers/user/lib/user'
import { logSuccessAndExit, logErrorAndExit } from '../scripts_utils.js'

const [ userId, action, role ] = process.argv.slice(2)

if (action === 'add') {
  addRole(userId, role)
  .then(logSuccessAndExit.bind(null, `Role ${action}`))
  .catch(logErrorAndExit.bind(null, `Role ${action} err`))
} else if (action === 'remove') {
  removeRole(userId, role)
  .then(logSuccessAndExit.bind(null, `Role ${action}`))
  .catch(logErrorAndExit.bind(null, `Role ${action} err`))
} else {
  logErrorAndExit(`Unknown action: ${action}`)
}
