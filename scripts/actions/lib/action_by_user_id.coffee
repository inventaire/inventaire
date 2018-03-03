CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionByInput = require './action_by_input'

[ userId ] = process.argv.slice 2

_.log userId, 'userId'

unless _.isUserId userId then throw new Error('invalid userId')

module.exports = ActionByInput userId
