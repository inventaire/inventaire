// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const pass = require('./pass')

// Applies to both API and static files requests
if (CONFIG.noCache) {
  exports.cacheControl = (req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    return next()
  }
} else {
  exports.cacheControl = pass
}
