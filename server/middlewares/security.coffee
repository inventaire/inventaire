CONFIG = require 'config'
_ = require('config').universalPath.require 'builders', 'utils'

exports.allowCrossDomain = (req, res, next)->
  res.header 'Access-Control-Allow-Origin', '*'
  res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE'
  res.header 'Access-Control-Allow-Headers', 'Content-Type'
  next()

# script-src 'unsafe-eval' is needed by jQuery.getScript
# style-src 'unsafe-inline' seem to be needed by Modernizr
# connect-src * is required to use PouchDB replication
policy =
  """
  child-src 'self' wikipedia.org;
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.wikidata.org;
  style-src 'self' 'unsafe-inline';
  img-src *;
  connect-src *;
  report-uri /api/logs/public;
  """

exports.cspPolicy = (req, res, next) ->
  res.header 'Content-Security-Policy', policy
  res.header 'X-Content-Security-Policy', policy
  res.header 'X-WebKit-CSP', policy
  next()

exports.csrf = (req, res, next) ->
  res.locals.token = req.session._csrf
  next()