_ = require('config').universalPath.require 'builders', 'utils'

exports.langCookie = (req, res, next) ->
  unless req.cookies?.lang?
    if lang = req.headers?['accept-language']?[0..1]
      if lang in validLanguage
        res.cookie('lang',lang)
        _.info "setting lang cookie, #{lang}"
  next()

validLanguage = ['en', 'fr', 'de']