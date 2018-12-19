CONFIG = require 'config'
__ = CONFIG.universalPath
_ = require 'lodash'
server_ = __.require 'utils', 'base'
types_ = __.require 'utils', 'assert_types'
logs_ = __.require('utils', 'logs')(_)
json_ = __.require 'utils', 'json'
regex_ = __.require 'lib', 'regex'
booleanTests_ = __.require 'lib', 'boolean_tests'

if not CONFIG.typeCheck
  types_.assertType = _.noop
  types_.assertTypes = _.noop

module.exports = _.extend _, server_, types_, logs_, json_, booleanTests_
