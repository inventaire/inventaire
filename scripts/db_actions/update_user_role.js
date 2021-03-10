#!/usr/bin/env node
const { addRole, removeRole } = require('controllers/user/lib/user')
const [ userId, action, role ] = process.argv.slice(2)
const { logSuccessAndExit, logErrorAndExit } = require('../scripts_utils')

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
