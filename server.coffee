CONFIG = require 'config'
americano = require 'americano'

# helper to require libs shared with the client-side
global.sharedLib = sharedLib = require './shared_libs'
global._ = require './server/helpers/utils'

americano.start name: CONFIG.name, port: CONFIG.port, host: CONFIG.host
