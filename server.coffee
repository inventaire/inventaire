console.time 'startup'
CONFIG = require 'config'
# Signal to other CONFIG consumers that they are in a server context
# and not simply scripts being executed in the wild
CONFIG.serverMode = true

[ port, host, env ] = process.argv.slice 2

if port? then CONFIG.port = port
if host? then CONFIG.host = host
if env?
  CONFIG.env = env
  console.log 'env manual change', process.env.NODE_ENV = env

__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fs = require 'fs'

# Needs to be run before the first promise is fired
# so that the configuration applies to all
{ Promise } = __.require 'lib', 'promises'

couchInit = __.require 'couch', 'init'

__.require('lib', 'before_startup')()

if CONFIG.verbosity > 0
  _.logErrorsCount()
  _.log "env: #{CONFIG.env}"
  _.log "host: #{CONFIG.fullHost()}"

couchInit()
.then _.Log('couch init')
.then ->
  require('./server/init_express')()
  .then ->
    # Provides a way to know when the server
    # started listening by observing file change
    # Expected by scripts/test_api
    # Pass noop as callback to avoid getting a DeprecationWarning
    fs.writeFile "./run/#{CONFIG.port}", process.pid, _.noop
    console.timeEnd 'startup'

  if CONFIG.couch2elastic4sync.activated
    # Need to wait for databases to exist
    __.require('scripts', 'couch2elastic4sync/exec')('sync')

  # Run once the databases are ready to prevent having multiple error messages
  # if databases aren't properly setup
  __.require('lib', 'emails/mailer')()

.catch _.Error('init err')
