# A module to look for works labels occurences in an author's Wikipedia articles.

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
getWikipediaArticle = __.require 'data', 'wikipedia/get_article'
getBnfAuthorWorksTitles = __.require 'data', 'bnf/get_bnf_author_works_titles'
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

  if worksLabels.length is 0 then return promises_.resolve false

  # get Wikipedia article title from URI
  getEntityByUri wdAuthorUri
  .then (authorEntity)->
    promises_.all [
      hasWikipediaOccurrence authorEntity, worksLabels, worksLabelsLangs
      hasBnfOccurrence authorEntity, worksLabels
    ]
  .spread (wpBool, bnfBool)-> wpBool or bnfBool
  .catch (err)->
    _.error err, 'has works labels occurrence err'
    # Default to false if an error happened
    return false

hasWikipediaOccurrence = (authorEntity, worksLabels, worksLabelsLangs)->
  promises_.all getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs)
  .then (articles)->
    # Match any of the works labels
    worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi')
    for article in articles
      if article.extract.match(worksLabelsPattern)? then return true
    return false

getMostRelevantWikipediaArticles = (authorEntity, worksLabelsLangs)->
  { sitelinks, originalLang } = authorEntity

  unless sitelinks? then throw error_.new 'missing sitelinks', 500, { authorEntity }

  return _.uniq worksLabelsLangs.concat([ originalLang, 'en' ])
  .map (lang)->
    title = sitelinks["#{lang}wiki"]
    if title? then return { lang, title }
  .filter _.identity
  .map getWikipediaArticleFromSitelinkData

getWikipediaArticleFromSitelinkData = (sitelinkData)->
  { lang, title } = sitelinkData
  return getWikipediaArticle lang, title

hasBnfOccurrence = (authorEntity, worksLabels)->
  bnfIds = authorEntity.claims.P268
  # Discard entities with several ids as one of the two
  # is wrong and we can't know which
  if bnfIds?.length isnt 1 then return false
  getBnfAuthorWorksTitles bnfIds[0]
  .then (titles)-> _.haveAMatch titles, worksLabels
