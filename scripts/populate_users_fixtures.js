#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createUserWithItems } = require('../api_tests/fixtures/populate')

createUserWithItems()
.then(userCreated => {
  _.success('#### New User available ####')
  console.log(`Your can now login with :
  - Username : ${userCreated.username}
  - Password : 12345678`)
  return process.exit(0)
})
.catch(_.Error('users fixture err'))
