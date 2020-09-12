#!/usr/bin/env node
const __ = require('config').universalPath
const { addRole, removeRole } = __.require('controllers', 'user/lib/user')
const [ userId, action, role ] = process.argv.slice(2)

if (action === 'add') {
  addRole(userId, role)
  .then(() => {
    console.log('Role added', role)
  })
  .catch(console.error)
} else if (action === 'remove') {
  removeRole(userId, role)
  .then(() => {
    console.log('Role removed', role)
  })
  .catch(console.error)
} else {
  console.error('Unknown action', action)
  process.exit(1)
}
