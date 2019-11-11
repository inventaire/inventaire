__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

searchByText = require '../search_by_text'
getBestLangValue = __.require 'lib', 'get_best_lang_value'
getEntitiesByUris = require '../get_entities_by_uris'
workEntitiesCache = require './work_entity_search_deduplicating_cache'
{ matchTitle, matchAuthor } = require './work_entity_search_utils'

# Search an existing work by title and authors from a seed
# to avoid creating duplicates if a corresponding work already exists
module.exports = (seed)->
  { title, authors, lang, groupLang } = seed
  # unless a lang is explicitly passed, deduce it from the the ISBN groupLang
  lang or= groupLang

  validAuthors = _.isArray(authors) and _.every authors, _.isNonEmptyString
  unless _.isNonEmptyString(title) and validAuthors
    _.warn seed, 'unsufficient seed data to search a pre-existing work entity'
    return promises_.resolve()

  cachedWorkPromise = workEntitiesCache.get seed
  if cachedWorkPromise? then return cachedWorkPromise

  searchByText { search: title, lang }
  .filter isWork
  # Make a first filter from the results we got
  .filter matchTitle(title, lang)
  # Fetch the data we miss to check author match
  .map AddAuthorsStrings(lang)
  # Filter the remaining results on authors
  .filter matchAuthor(authors, lang)
  .then (matches)->
    if matches.length > 1 then _.warn matches, 'possible duplicates'
    return matches[0]

isWork = (entity)-> entity.type is 'work'

AddAuthorsStrings = (lang)-> (result)->
  authorsUris = result.claims['wdt:P50']
  unless authorsUris?.length > 0
    _.warn result, 'no authors to add'
    result.authors = []
    return result

  getEntitiesByUris { uris: authorsUris }
  .then ParseAuthorsStrings(lang)
  .then (authorsStrings)->
    result.authors = authorsStrings
    return result

ParseAuthorsStrings = (lang)-> (res)->
  _.values res.entities
  .map (authorEntity)->
    getBestLangValue(lang, authorEntity.originalLang, authorEntity.labels).value
