CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
express = require 'express'
{ env, port, host, name } = CONFIG

middlewares = require './middlewares/middlewares'
middlewaresList = middlewares.common.concat (middlewares[CONFIG.env] or [])

routes = require './controllers/routes'

app = express()

for middleware in middlewaresList
  if _.isArray(middleware) then app.use.apply app, middleware
  else app.use middleware

for endpoint, controllers of routes
  for verb, controller of controllers
    app[verb]("/#{endpoint}", controller)

# Should be used after all middlewares and routes
# cf http://expressjs.com/fr/guide/error-handling.html
app.use require('./middlewares/error_handler')

app.disable 'x-powered-by'

module.exports = ->
  return new Promise (resolve, reject)->
    app.listen port, host, (err)->
      if err then reject err
      else
        _.info "#{name} server is listening on port #{port}..."
        resolve app
