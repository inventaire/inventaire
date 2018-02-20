__ = require('config').universalPath
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models', 'tests/common'
getArticle = require './get_article'

module.exports = (req, res)->
  { query } = req
  { lang, title } = query

  unless _.isNonEmptyString lang
    return error_.bundleMissingQuery req, res, 'lang'

  unless _.isNonEmptyString title
    return error_.bundleMissingQuery req, res, 'title'

  unless tests.wikiLang lang
    return error_.bundleInvalid req, res, 'lang', lang

  key = "wpextract:#{lang}:#{title}"
  cache_.get key, getArticle.bind(null, lang, title, true)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
