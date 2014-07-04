CONFIG = require('config')
americano = require('americano')

global._ = require './server/helpers/utils'

americano.start name: CONFIG.name, port: CONFIG.port, host: CONFIG.host