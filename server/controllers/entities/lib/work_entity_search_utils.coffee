__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

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

MatchAuthor = (authors, lang)-> (result)->
  _.log authors, 'authors'
  _.log result.authors, 'result.authors'
  # Consider its a match if one or more author match
  # given we already know that the title matches
  _.matchesCount(authors.map(formatAuthor), result.authors.map(formatAuthor)) > 0

# We want to have a rather high level of certitude that this is the same
MatchTitle = (title, lang)-> (result)->
  resultTitle = getBestLangValue lang, result.originalLang, result.labels
  return _.log(formatTitle(resultTitle), 'result title') is _.log(formatTitle(title), 'seed title')

module.exports = { formatTitle, formatAuthor, MatchAuthor, MatchTitle }
