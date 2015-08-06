__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
tests = __.require 'models', 'tests/common-tests'

module.exports = (req, res)->
  { query } = req
  { lang, title } = query

  unless tests.lang lang
    return error_.bundle res, 'bad lang parameter', 400, query

  unless title?.length > 0
    return error_.bundle res, 'missing title', 400, query

  key = "wpextract:#{lang}:#{title}"
  cache_.get key, requestExtract.bind(null, lang, title)
  .then res.json.bind(res)
  .catch error_.Handler(res)

requestExtract = (lang, title)->
  promises_.get apiQuery(lang, title)
  .then (res)->
    { pages } = res.query
    unless pages?
      throw error_.new 'invalid extract response', 500, arguments, res.query

    for id, page of pages
      { extract } = page
    return data =
      extract: extract
      url: "https://#{lang}.wikipedia.org/wiki/#{title}"


apiQuery = (lang, title)->
  "http://#{lang}.wikipedia.org/w/api.php?format=json&action=query&titles=#{title}&prop=extracts&explaintext=true&exintro=true&exsentences=20"
