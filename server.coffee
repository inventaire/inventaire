env = process.argv[2]
host = process.argv[3]
port = process.argv[4]

if env?
  console.log 'env manual change', process.env.NODE_ENV = env

CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'
https = require 'https'
fs = require 'fs'

CONFIG.host = host  if host?
CONFIG.port = port  if port?

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG, 'CONFIG'
  _.log CONFIG.fullHost(), 'fullHost'

options =
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
  root: process.cwd()

if CONFIG.protocol is 'https'

  key = fs.readFileSync CONFIG.https.key, 'utf8'
  cert = fs.readFileSync CONFIG.https.cert, 'utf8'

  if key? and cert?
    _.info 'https options found'
    httpsOptions =
      key: key
      cert: cert
  else throw new Error('https options not found')

  # using americano._new instead of americano.start
  # to get an app object and start the server with
  # node's https module, as recommanded in Express documentation
  # http://expressjs.com/4x/api.html#app.listen
  # doing so make 'beforeStart' and'afterStart' unusable

  # a root and a callback are required by the internal
  # americano._new method
  app = americano._new(options, (app) -> app)

  https.createServer(httpsOptions, app).listen(options.port)

  _.info "#{options.name} server is listening on port #{options.port}..."

else
  americano.start options