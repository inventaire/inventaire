CONFIG = require 'config'
__ = CONFIG.universalPath
_ = require 'lodash'
server_ = __.require 'utils', 'base'
shared_ = __.require('sharedLibs', 'utils')(_)
types_ = __.require('sharedLibs', 'types')(_)
logs_ = __.require('utils', 'logs')(_)
json_ = __.require 'utils', 'json'
regex_ = __.require 'sharedLibs', 'regex'
tests_ = __.require('sharedLibs', 'tests')(regex_)

if not CONFIG.typeCheck
  types_.type = _.noop
  types_.types = _.noop

module.exports = _.extend _, server_, shared_, types_, logs_, json_, tests_

# GLOBALS
# building it there as utils are required everywhere
# making it less a pain to do manual or automatic tests
# depending on those

# globals should be limited as much as possible

__.require('lib', 'global_libs_extender')()
