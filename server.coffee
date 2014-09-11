CONFIG = require 'config'
americano = require 'americano'

global.sharedLib = sharedLib = require('./shared_libs')
global._ = sharedLib 'utils'

americano.start name: CONFIG.name, port: CONFIG.port, host: CONFIG.host
