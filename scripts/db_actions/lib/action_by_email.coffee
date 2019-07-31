CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
ActionByInput = require './action_by_input'

[ email ] = process.argv.slice 2

_.log email, 'email'

validations = __.require 'models', 'validations/common'

unless validations.email email then throw new Error('invalid email')

module.exports = ActionByInput email
