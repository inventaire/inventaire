const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const ActionByInput = require('./action_by_input')

const [ userId ] = process.argv.slice(2)

_.log(userId, 'userId')

if (!_.isUserId(userId)) throw new Error('invalid user id')

module.exports = ActionByInput(userId)
