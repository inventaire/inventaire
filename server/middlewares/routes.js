

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
