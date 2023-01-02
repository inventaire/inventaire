import CONFIG from 'config'
import express from 'express'
import _ from '#builders/utils'
import middlewares from './middlewares/middlewares.js'
import routes from './controllers/routes.js'

const { port, host, name, publicProtocol } = CONFIG

export function initExpress () {
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

  if (publicProtocol === 'https') {
    // Allows Nginx to pass a "X-Forwarded-Proto=https" header
    // Required to set secure cookies
    // See https://expressjs.com/en/api.html#trust.proxy.options.table
    app.set('trust proxy', 'loopback')
  }

  app.disable('x-powered-by')

  return new Promise((resolve, reject) => {
    app.listen(port, host, err => {
      if (err) {
        reject(err)
      } else {
        _.info(`${name} server is listening on port ${port}...`)
        resolve(app)
      }
    })
  })
}
