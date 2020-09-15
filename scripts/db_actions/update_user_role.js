#!/usr/bin/env node
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { addRole, removeRole } = __.require('controllers', 'user/lib/user')
const [ userId, action, role ] = process.argv.slice(2)

const logErrorAndExit = err => {
  console.error(err)
  process.exit(1)
}

const logSuccessAndExit = () => {
  _.success(role, `Role ${action}`)
  process.exit(0)
}

if (action === 'add') {
  addRole(userId, role)
  .then(logSuccessAndExit)
  .catch(logErrorAndExit)
} else if (action === 'remove') {
  removeRole(userId, role)
  .then(logSuccessAndExit)
  .catch(logErrorAndExit)
} else {
  console.error('Unknown action', action)
  process.exit(1)
}
