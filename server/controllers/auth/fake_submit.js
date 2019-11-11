// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

// Allows authentification forms to submit a form already
// validated by XHR calls, in order to be catched by browsers
// password manager or other field suggestions tools
// Using a different endpoint (/api/submit) than /api/auth so that
// server/middlewares/content.coffee fakeSubmitException can be applied
// to the strict minimum
module.exports = {
  post(req, res, next){
    const { redirect } = req.query
    const { referer } = req.headers
    const route = solveRoute(redirect, referer)
    return res.redirect(route)
  }
}

// Possible redirection parameters by priority
// - a redirect parameter in the query string
// - the referer found in headers
// - the root
var solveRoute = function(redirect, referer){
  if (redirect != null) { return `/${redirect}`
  } else { return referer || '/' }
}
