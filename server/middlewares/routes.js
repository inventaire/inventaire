module.exports = {
  legacyApiRedirect: (req, res, next) => {
    const parts = req._parsedUrl.pathname.split('/')
    if (parts[3] === 'public') {
      const rewroteUrl = req.url.replace('/public', '')
      res.redirect(rewroteUrl)
    } else {
      next()
    }
  },

  methodOverride: require('method-override')()
}
