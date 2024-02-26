import CONFIG from 'config'
import express from 'express'
import serveFavicon from 'serve-favicon'
import { absolutePath } from '#lib/absolute_path'
import { pass } from './pass.js'

export let mountStaticFiles
export let favicon

if (CONFIG.serveStaticFiles) {
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
  mountStaticFiles = [ '/public', staticMiddleware ]

  const faviconPath = absolutePath('client', 'public/favicon.ico')
  favicon = serveFavicon(faviconPath)
  // statics = { mountStaticFiles, favicon }
} else {
  // statics = { mountStaticFiles: pass, favicon: pass }
  mountStaticFiles = pass
  favicon = pass
}
