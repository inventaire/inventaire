__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)
stringsAreClose = __.require 'lib', 'strings_are_close'

formatTitle = (str)->
  str
  .toLowerCase()
  # remove part in parenthesis at then end of a title
  .replace /\s\([^\)]+\)$/, ''
  # Ignore leading articles as they are a big source of false negative match
  .replace /^(the|a|le|la|l'|der|die|das)\s/ig, ''

formatAuthor = (str)->
  str
  .toLowerCase()
  # Work around the various author name notations
  .replace /\./g, ' '
  # Replace all groups of spaces that might have emerged above by a single space
  .replace /\s+/g, ' '
  .trim()

MatchAuthor = (authors, lang)-> (result)->
  unless _.isArray(authors) and _.isArray(result.authors) then return false
  # Consider its a match if one or more author match
  # given we already know that the title matches
  authors = _.compact(authors).map(formatAuthor)
  resultAuthors = _.compact(result.authors).map(formatAuthor)

  for authorA in authors
    for authorB in resultAuthors
      if stringsAreClose(authorA, authorB) then return true

  return false

# We want to have a rather high level of certitude that this is the same
MatchTitle = (title, lang)-> (result)->
  # TODO: Compare on other languages and aliases too
  # Ex: "Virginie Lou" should be matched with "Virginie Lou-nony"
  resultTitle = getBestLangValue(lang, result.originalLang, result.labels).value
  unless _.isString(title) and _.isString(resultTitle) then return false
  return stringsAreClose formatTitle(resultTitle), formatTitle(title)

module.exports = { formatTitle, formatAuthor, MatchAuthor, MatchTitle }
