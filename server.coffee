CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'

# helper to require libs shared with the client-side
# need to be a global variable, as the shared libs
# depend on it
global.sharedLib = sharedLib = __.require 'builders', 'shared_libs'
global_libs_extender = __.require 'lib', 'global_libs_extender'
global_libs_extender.initialize()


CONFIG.host = process.argv[2]  if process.argv[2]?
CONFIG.port = process.argv[3]  if process.argv[3]?

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG, 'CONFIG'
  _.log CONFIG.fullHost(), 'fullHost'

americano.start
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
