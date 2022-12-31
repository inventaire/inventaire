import CONFIG from 'config'
import pass from './pass'
const __ = CONFIG.universalPath

let statics = {}

if (CONFIG.serveStaticFiles) {
  const express = require('express')
  const publicPath = __.path('client', 'public')
  const options = {
    maxAge: 0,
    setHeaders: res => {
      res.header('cache-control', 'no-cache, no-store, must-revalidate')
    },
    // Return a 404 when a file isn't found
    fallthrough: false,
  }
  const staticMiddleware = express.static(publicPath, options)
  // the 2 arguments array will be apply'ied to app.use by server/init_express
  const mountStaticFiles = [ '/public', staticMiddleware ]

  const faviconPath = __.path('client', 'public/favicon.ico')
  const favicon = require('serve-favicon')(faviconPath)
  statics = { mountStaticFiles, favicon }
} else {
  statics = { mountStaticFiles: pass, favicon: pass }
}

export default statics
