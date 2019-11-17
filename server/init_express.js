// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const express = require('express')
const { env, port, host, name } = CONFIG

const middlewares = require('./middlewares/middlewares')
const middlewaresList = middlewares.common.concat((middlewares[env] || []))

const routes = require('./controllers/routes')

const app = express()

for (const middleware of middlewaresList) {
  if (_.isArray(middleware)) {
    app.use.apply(app, middleware)
  } else {
    app.use(middleware)
  }
}

for (const endpoint in routes) {
  const controllers = routes[endpoint]
  for (const verb in controllers) {
    const controller = controllers[verb]
    app[verb](`/${endpoint}`, controller)
  }
}

// Should be used after all middlewares and routes
// cf http://expressjs.com/fr/guide/error-handling.html
app.use(require('./middlewares/error_handler'))

app.disable('x-powered-by')

module.exports = () => new Promise((resolve, reject) => app.listen(port, host, err => {
  if (err) {
    return reject(err)
  } else {
    _.info(`${name} server is listening on port ${port}...`)
    return resolve(app)
  }
}))
