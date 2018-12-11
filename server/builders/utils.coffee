CONFIG = require 'config'
__ = CONFIG.universalPath
_ = require 'lodash'
server_ = __.require 'utils', 'base'
types_ = __.require('lib', 'types')(_)
logs_ = __.require('utils', 'logs')(_)
json_ = __.require 'utils', 'json'
regex_ = __.require 'lib', 'regex'
booleanTests_ = __.require 'lib', 'boolean_tests'

if not CONFIG.typeCheck
  types_.type = _.noop
  types_.types = _.noop

module.exports = _.extend _, server_, types_, logs_, json_, booleanTests_
