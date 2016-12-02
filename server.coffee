console.time 'startup'
CONFIG = require 'config'

[port, host, env] = process.argv.slice(2)

if port? then CONFIG.port = port
if host? then CONFIG.host = host
if env?
  CONFIG.env = env
  console.log 'env manual change', process.env.NODE_ENV = env

__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
americano = require 'americano'
fs = require 'fs'

# Needs to be run before the first promise is fired
# so that the configuration applies to all
{ Promise } = __.require 'lib', 'promises'

couchInit = __.require 'couch', 'init'

__.require('lib', 'before_startup')()

if CONFIG.verbosity > 0
  _.logErrorsCount()
  _.log "env: #{CONFIG.env}"
  _.log "port: #{CONFIG.port}"
  _.log "host: #{CONFIG.host}"

if CONFIG.verbosity > 1 or process.argv.length > 2
  _.log CONFIG.fullHost(), 'fullHost'

options =
  name: CONFIG.name
  host: CONFIG.host
  port: CONFIG.port
  root: process.cwd()

couchInit()
.then _.Log('couch init')
.then ->
  americano.start options, (err, app)->
    app.disable 'x-powered-by'
    console.timeEnd 'startup'

.catch _.Error('init err')

__.require('lib', 'emails/mailer')()

# Progressive contributor setup: allow to start without having to install ElasticSearch
if CONFIG.elasticsearch.enabled
  __.require('scripts', 'couch2elastic4sync/exec')('sync')
else
  _.warn 'ElasticSearch is disabled: activate it in ./config/local.coffee by setting elasticsearch.enabled=true'
