CONFIG = require('config')
__ = CONFIG.root

lo = require 'lodash'

serverUtils = __.require 'lib', 'utils'
if CONFIG.verbosity is 0 then serverUtils.log = lo.identity

typeUtils = __.require 'lib', 'type_utils'
if not CONFIG.typeCheck then typeUtils.types = lo.noop

utils = lo.extend(lo, serverUtils, typeUtils)

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
__.require('lib', 'global_libs_extender')()
