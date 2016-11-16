CONFIG = require './get_custom_config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionByInput = require './action_by_input'

[ email ] = process.argv.slice 2

_.log email, 'email'

tests = __.require 'models','tests/common-tests'

unless tests.email email then throw new Error('invalid email')

module.exports = ActionByInput email
