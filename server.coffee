env = process.argv[2]
host = process.argv[3]
port = process.argv[4]

if env?
  console.log 'env manual change', process.env.NODE_ENV = env

CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'

CONFIG.host = host  if host?
CONFIG.port = port  if port?

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG, 'CONFIG'
  _.log CONFIG.fullHost(), 'fullHost'

americano.start
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
