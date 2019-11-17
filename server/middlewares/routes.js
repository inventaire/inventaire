// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')

module.exports = {
  legacyApiRedirect: (req, res, next) => {
    const parts = req._parsedUrl.pathname.split('/')
    if (parts[3] === 'public') {
      const rewroteUrl = req.url.replace('/public', '')
      return res.redirect(rewroteUrl)
    } else {
      return next()
    }
  },

  methodOverride: require('method-override')()
}
