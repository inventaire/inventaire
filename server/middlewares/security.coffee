CONFIG = require 'config'
_ = require('config').root.require 'builders', 'utils'

if CONFIG.protocol is 'https'
  exports.forceSSL = require 'express-force-ssl'
  _.info 'forcing SSL'
else
  exports.forceSSL = (req, res, next)-> next()


# middlewares following recommandations found here for the implementation of Persona
# http://www.mircozeiss.com/mozilla-persona-example-app-with-express-and-couchdb/

exports.allowCrossDomain = (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
  res.header 'Access-Control-Allow-Headers', 'Content-Type'
  next()

policy = """
  default-src 'self';
  frame-src 'self' https://login.persona.org;
  script-src 'self' 'unsafe-inline' https://login.persona.org;
  style-src 'self' 'unsafe-inline'
  """

exports.cspPolicy = (req, res, next) ->
  res.header 'X-Content-Security-Policy', policy # Firefox and Internet Explorer
  res.header 'X-WebKit-CSP', policy # Safari and Chrome
  next()

exports.csrf = (req, res, next) ->
  res.locals.token = req.session._csrf
  next()