CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'
express = require 'express'
{ env, port, host, name, verbosity, readOnly } = CONFIG

middlewares = require './middlewares/middlewares'
middlewaresList = middlewares.common.concat (middlewares[CONFIG.env] or [])

middlewareErrorHandler = require './middlewares/error_handler'

routes = require './controllers/routes'

module.exports = ->
  app = express()

  for middleware in middlewaresList
    if _.isArray(middleware) then app.use.apply app, middleware
    else app.use middleware

  if readOnly then _.warn 'read-only mode: non-get endpoints are disabled'

  for endpoint, controllers of routes
    for verb, controller of controllers
      if not readOnly or verb is 'get'
        app[verb]("/#{endpoint}", controller)

  # Should be used after all middlewares and routes
  # cf http://expressjs.com/fr/guide/error-handling.html
  app.use middlewareErrorHandler

  app.disable 'x-powered-by'

  return new Promise (resolve, reject)->
    app.listen port, host, (err)->
      if err then reject err
      else
        _.info "#{name} server is listening on port #{port}..."
        resolve app
