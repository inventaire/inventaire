# A module to look for works labels occurences in an author's Wikipedia articles.

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
qs = require 'querystring'
getWikipediaArticle = __.require 'data', 'wikipedia/get_article'
getEntityByUri = __.require 'controllers', 'entities/lib/get_entity_by_uri'
wd_ = __.require 'lib', 'wikidata/wikidata'

# - worksLabels: labels from works of an author suspected
#   to be the same as the wdAuthorUri author
# - worksLabelsLangs: those labels language, indicating which Wikipedia editions
#   should be checked
module.exports = (wdAuthorUri, worksLabels, worksLabelsLangs)->
  _.type wdAuthorUri, 'string'
  _.type worksLabels, 'array'
  _.type worksLabelsLangs, 'array'

  unless wd_.isWdEntityUri wdAuthorUri then return promises_.resolve 0

  # Filter-out labels that are too short, as it could generate false positives
  worksLabels = worksLabels.filter (label)-> label.length > 5

  if worksLabels.length is 0 then return promises_.resolve 0

  # Match any of the works labels
  worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi')

  # get Wikipedia article title from URI
  getEntityByUri wdAuthorUri
  .then getBestSitelinks(worksLabelsLangs)
  .map (sitelinkData)->
    { lang, title } = sitelinkData
    return getWikipediaArticle lang, title
  .then (articles)->
    for article in articles
      if article.extract.match(worksLabelsPattern)? then return true
    return false

getBestSitelinks = (worksLabelsLangs)-> (entity)->
  { sitelinks, originalLang } = entity

  return _.uniq worksLabelsLangs.concat([ originalLang, 'en' ])
  .map (lang)->
    title = sitelinks["#{lang}wiki"]
    if title? then return { lang, title }
  .filter _.identity
