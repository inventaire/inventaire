
const CONFIG = require('config')
const __ = CONFIG.universalPath
const pass = require('./pass')

if (CONFIG.serveStaticFiles) {
  const express = require('express')
  const publicPath = __.path('client', 'public')
  const staticMiddleware = express.static(publicPath, { maxAge: CONFIG.staticMaxAge, fallthrough: false })
  // the 2 arguments array will be apply'ied to app.use by server/init_express
  exports.mountStaticFiles = [ '/public', staticMiddleware ]

  const faviconPath = __.path('client', 'public/favicon.ico')
  exports.favicon = require('serve-favicon')(faviconPath)
} else {
  exports.mountStaticFiles = pass
  exports.favicon = pass
}

exports.enableCors = (req, res, next) => {
  if (req.originalUrl.startsWith('/public')) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Method', 'GET')
  }

  return next()
}
