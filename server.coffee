CONFIG = require 'config'
americano = require 'americano'


# helper to require libs shared with the client-side
global.sharedLib = sharedLib = require './shared_libs'
global._ = require './server/helpers/utils'
require('./server/helpers/global_libs_extender').initialize()


CONFIG.host = process.argv[2]  if process.argv[2]?
CONFIG.port = process.argv[3]  if process.argv[3]?

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG, 'CONFIG'
  _.log CONFIG.fullHost(), 'fullHost'

americano.start
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
