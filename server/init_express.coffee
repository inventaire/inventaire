CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'
express = require 'express'
{ env, port, host, name, verbosity } = CONFIG

module.exports = ->
  middlewares = require './middlewares/middlewares'
  envMiddlewares = middlewares[CONFIG.env] or []
  middlewaresList = middlewares.common.concat envMiddlewares

  routes = require './controllers/routes'

  app = express()

  for middleware in middlewaresList
    if _.isArray(middleware) then app.use.apply app, middleware
    else app.use middleware

  for endpoint, controllers of routes
    for verb, controller of controllers
      app[verb]("/#{endpoint}", controller)

  app.disable 'x-powered-by'

  return new Promise (resolve, reject)->
    app.listen port, host, (err)->
      if err then reject err
      else
        _.info "#{name} server is listening on port #{port}..."
        resolve app
