__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require 'lib', 'get_best_lang_value'
stringsAreClose = __.require 'lib', 'strings_are_close'
{ normalizeTerm } = require '../terms_normalization'

matchAuthor = (authors, lang)-> (result)->
  unless _.isArray(authors) and _.isArray(result.authors) then return false
  # Consider its a match if one or more author match
  # given we already know that the title matches
  authors = _.compact(authors).map(normalizeTerm)
  resultAuthors = _.compact(result.authors).map(normalizeTerm)

  for authorA in authors
    for authorB in resultAuthors
      if stringsAreClose(authorA, authorB) then return true

  return false

# We want to have a rather high level of certitude that this is the same
matchTitle = (title, lang)-> (result)->
  # TODO: Compare on other languages and aliases too
  # Ex: "Virginie Lou" should be matched with "Virginie Lou-nony"
  resultTitle = getBestLangValue(lang, result.originalLang, result.labels).value
  unless _.isString(title) and _.isString(resultTitle) then return false

  formattedTitle = normalizeTerm title
  formattedResultTitle = normalizeTerm resultTitle

  if volumePattern.test title then return title is resultTitle
  else return stringsAreClose formattedTitle, formattedResultTitle

# Conservative assumption: consider any title with a number to potentially be a volume title
# and thus be more strict in those cases
volumePattern = /\d+/

module.exports = { matchAuthor, matchTitle }
