__ = require('config').root

lo = require 'lodash'
serverUtils = __.require 'lib', 'utils'

utils = lo.extend(lo, serverUtils)

sharedUtils = __.require('sharedLibs', 'utils')(utils)

module.exports = lo.extend(utils, sharedUtils)

# GLOBALS
# building it there as utils are required everywhere
# making it less a pain to do manual or automatic tests
# depending on those

# globals should be limited as much as possible

# helper to require libs shared with the client-side
# need to be a global variable, as the shared libs
# depend on it
global.sharedLib = sharedLib = __.require 'builders', 'shared_libs'
global_libs_extender = __.require 'lib', 'global_libs_extender'
global_libs_extender.initialize()
