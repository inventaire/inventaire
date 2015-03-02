CONFIG = require 'config'
__ = CONFIG.root

lo = require 'lodash'

server_ = __.require 'utils', 'base'
logs_ = __.require('utils', 'logs')(lo)

types_ = __.require 'sharedLibs', 'types'
if not CONFIG.typeCheck then types_.types = lo.noop

utils = lo.extend(lo, server_, logs_, types_)

sharedUtils = __.require('sharedLibs', 'utils')(utils)

module.exports = lo.extend(utils, sharedUtils)

# GLOBALS
# building it there as utils are required everywhere
# making it less a pain to do manual or automatic tests
# depending on those

# globals should be limited as much as possible

__.require('lib', 'global_libs_extender')()
