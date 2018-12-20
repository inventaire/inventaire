CONFIG = require 'config'
__ = CONFIG.universalPath
_ = require 'lodash'
server_ = __.require 'utils', 'base'
types_ = __.require 'utils', 'assert_types'
logs_ = __.require('utils', 'logs')(_)
json_ = __.require 'utils', 'json'
booleanValidations_ = __.require 'lib', 'boolean_validations'

module.exports = _.extend _, server_, types_, logs_, json_, booleanValidations_
