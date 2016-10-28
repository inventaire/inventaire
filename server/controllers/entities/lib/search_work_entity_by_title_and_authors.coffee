__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

searchByText = require '../search_by_text'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)
getEntitiesByUris = require './get_entities_by_uris'

# Search an existing work by title and authors from a seed
# to avoid creating dupplicates if a corresponding work already exists
module.exports = (seed)->
  { title, authors, groupLang:lang } = seed
  _.log seed, 'seed'
  searchByText
    search: title
    lang: lang
    # Having dataseed enable woud trigger a hell of a loop
    disableDataseed: true
  .then _.Log('results before title filter')
  # Make a first filter from the results we got
  .filter MatchTitle(title, lang)
  # Fetch the data we miss to check author match
  .map AddAuthorsStrings(lang)
  .then _.Log('results before author filter')
  # Filter the remaining results on authors
  .filter MatchAuthor(authors, lang)
  .then (matches)->
    if matches.length > 1 then _.warn matches, 'possible dupplicates'
    return matches[0]

# We want to have a rather high level of certitude that this is the same
MatchTitle = (title, lang)-> (result)->
  resultTitle = getBestLangValue lang, result.originalLang, result.labels
  return _.log(formatTitle(resultTitle), 'result title') is _.log(formatTitle(title), 'seed title')

AddAuthorsStrings = (lang)-> (result)->
  authorsUris = result.claims['wdt:P50']
  unless authorsUris.length > 0 then return result

  getEntitiesByUris authorsUris
  .then ParseAuthorsStrings(lang)
  .then (authorsStrings)->
    result.authors = authorsStrings
    return result

ParseAuthorsStrings = (lang)-> (res)->
  _.values res.entities
  .map (authorEntity)-> getBestLangValue lang, authorEntity.originalLang, authorEntity.labels

MatchAuthor = (authors, lang)-> (result)->
  _.log authors, 'authors'
  _.log result.authors, 'result.authors'
  # Consider its a match if one or more author match
  # given we already know that the title matches
  _.matchesCount(authors.map(formatAuthor), result.authors.map(formatAuthor)) > 0

formatTitle = (str)->
  str
  .toLowerCase()
  # remove part in parenthesis at then end of a title
  .replace /\s\([^\)]+\)$/, ''

formatAuthor = (str)->
  str
  .toLowerCase()
  # Work around the various author name notations
  .replace /\./g, ' '
  # Replace all groups of spaces that might have emerged above by a single space
  .replace /\s+/g, ' '
  .trim()
