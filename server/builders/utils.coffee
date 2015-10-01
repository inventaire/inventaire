CONFIG = require 'config'
__ = CONFIG.root

_ = require 'lodash'
_ = require('inv-utils')(_)

if not CONFIG.typeCheck then _.types = _.noop

server_ = __.require 'utils', 'base'
# add utils shared between the server and the client
# but not yet extracted to inv-utils
shared_ = __.require 'sharedLibs', 'utils'
logs_ = __.require('utils', 'logs')(_)
json_ = __.require 'utils', 'json'
regex_ = __.require 'sharedLibs', 'regex'
tests_ = __.require('sharedLibs', 'tests')(regex_)

module.exports = _.extend _, server_, shared_, logs_, json_, tests_

# GLOBALS
# building it there as utils are required everywhere
# making it less a pain to do manual or automatic tests
# depending on those

# globals should be limited as much as possible

__.require('lib', 'global_libs_extender')()
