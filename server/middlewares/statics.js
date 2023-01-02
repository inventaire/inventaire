import CONFIG from 'config'
import { absolutePath } from '#lib/absolute_path'
import pass from './pass.js'

let statics = {}

if (CONFIG.serveStaticFiles) {
  const express = require('express')
  const publicPath = absolutePath('client', 'public')
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

  const faviconPath = absolutePath('client', 'public/favicon.ico')
  const favicon = require('serve-favicon')(faviconPath)
  statics = { mountStaticFiles, favicon }
} else {
  statics = { mountStaticFiles: pass, favicon: pass }
}

export default statics
