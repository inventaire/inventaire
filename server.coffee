console.time 'startup'
CONFIG = require 'config'

[port, host, env] = process.argv.slice(2)

if port? then CONFIG.port = port
if host? then CONFIG.host = host
if env?
  CONFIG.env = env
  console.log 'env manual change', process.env.NODE_ENV = env

__ = CONFIG.root
_ = __.require 'builders', 'utils'
americano = require 'americano'
fs = require 'fs'
Radio = __.require 'lib', 'radio'

__.require('lib', 'before_startup')()

Radio.once 'db:ready', -> console.timeEnd 'startup'

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

# just keeping the https at hand in case the need arises
# but the default setup is an http server behind an nginx
# doing all the TLS magic
if CONFIG.protocol is 'https' then require('server-https')()
else
  americano.start options, (err, app, server)->
    app.disable 'x-powered-by'

mailer_ = __.require('lib', 'emails/mailer')()
