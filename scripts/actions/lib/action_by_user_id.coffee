CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionByInput = require './action_by_input'

[ userId ] = process.argv.slice 2

_.log userId, 'userId'

tests = __.require 'models','tests/common'

unless tests.userId userId then throw new Error('invalid userId')

module.exports = ActionByInput userId
