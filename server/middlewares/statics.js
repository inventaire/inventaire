const CONFIG = require('config')
const __ = CONFIG.universalPath
const pass = require('./pass')

const enableCors = (req, res, next) => {
  if (req.originalUrl.startsWith('/public')) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Method', 'GET')
  }
  next()
}

if (CONFIG.serveStaticFiles) {
  const express = require('express')
  const publicPath = __.path('client', 'public')
  const options = { maxAge: CONFIG.staticMaxAge, fallthrough: false }
  if (CONFIG.noCache) {
    options.setHeaders = res => {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    }
    options.maxAge = 0
    options.etag = false
  }
  const staticMiddleware = express.static(publicPath, options)
  // the 2 arguments array will be apply'ied to app.use by server/init_express
  const mountStaticFiles = [ '/public', staticMiddleware ]

  const faviconPath = __.path('client', 'public/favicon.ico')
  const favicon = require('serve-favicon')(faviconPath)

  module.exports = { enableCors, mountStaticFiles, favicon }
} else {
  module.exports = { enableCors, mountStaticFiles: pass, favicon: pass }
}
