const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const express = require('express')
const { port, host, name } = CONFIG

const middlewares = require('./middlewares/middlewares')
const routes = require('./controllers/routes')

const app = express()

for (const middleware of middlewares) {
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

module.exports = () => new Promise((resolve, reject) => {
  app.listen(port, host, err => {
    if (err) {
      reject(err)
    } else {
      _.info(`${name} server is listening on port ${port}...`)
      resolve(app)
    }
  })
})
