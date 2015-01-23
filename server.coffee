CONFIG = require 'config'
if CONFIG.monitoring
  # rather buggy
  require('look').start()

[env, host, port] = process.argv.slice(2)

if env?
  console.log 'env manual change', process.env.NODE_ENV = env

__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'
fs = require 'fs'

CONFIG.host = host  if host?
CONFIG.port = port  if port?

if CONFIG.verbosity > 0
  _.logErrorsCount()
  _.log CONFIG.env, 'env'

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG, 'CONFIG'
  _.log CONFIG.fullHost(), 'fullHost'

options =
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
  root: process.cwd()

if CONFIG.protocol is 'https'
  https = require 'https'
  http = require 'http'
  key = fs.readFileSync(options.root + CONFIG.https.key, 'utf8')
  cert = fs.readFileSync(options.root + CONFIG.https.cert, 'utf8')

  unless key? then throw new Error('https key not found')
  unless cert? then throw new Error('https cert not found')
  _.info 'https options found'
  httpsOptions =
    key: key
    cert: cert

  # using americano._new instead of americano.start
  # to get an app object and start the server with
  # node's https module, as recommanded in Express documentation
  # http://expressjs.com/4x/api.html#app.listen
  # doing so make 'beforeStart' and'afterStart' unusable

  # a root and a callback are required by the internal
  # americano._new method
  app = americano._new(options, (app) -> app)

  https.createServer(httpsOptions, app).listen(options.port)
  http.createServer(app).listen(80)
  _.info "#{options.name} server is listening on port #{options.port}..."

else
  americano.start options