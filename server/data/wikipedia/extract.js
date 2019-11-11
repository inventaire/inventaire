__ = require('config').universalPath
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
validations = __.require 'models', 'validations/common'
getArticle = require './get_article'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  title: {}
  lang: {}

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then (params)->
    { lang, title } = params
    getArticle { lang, title, introOnly: true }
  .then (data)->
    { url, extract } = data
    responses_.send res, { url, extract }
  .catch error_.Handler(req, res)
