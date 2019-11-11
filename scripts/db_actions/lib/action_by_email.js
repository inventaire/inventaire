// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const ActionByInput = require('./action_by_input')

const [ email ] = Array.from(process.argv.slice(2))

_.log(email, 'email')

const validations = __.require('models', 'validations/common')

if (!validations.email(email)) { throw new Error('invalid email') }

module.exports = ActionByInput(email)
