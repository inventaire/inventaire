
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const getBestLangValue = __.require('lib', 'get_best_lang_value')
const stringsAreClose = __.require('lib', 'strings_are_close')
const { normalizeTerm } = require('../terms_normalization')

const matchAuthor = (authors, lang) => result => {
  if (!_.isArray(authors) || !_.isArray(result.authors)) return false
  // Consider its a match if one or more author match
  // given we already know that the title matches
  authors = _.compact(authors).map(normalizeTerm)
  const resultAuthors = _.compact(result.authors).map(normalizeTerm)

  for (const authorA of authors) {
    for (const authorB of resultAuthors) {
      if (stringsAreClose(authorA, authorB)) return true
    }
  }

  return false
}

// We want to have a rather high level of certitude that this is the same
const matchTitle = (title, lang) => result => {
  // TODO: Compare on other languages and aliases too
  // Ex: "Virginie Lou" should be matched with "Virginie Lou-nony"
  const resultTitle = getBestLangValue(lang, result.originalLang, result.labels).value
  if (!_.isString(title) || !_.isString(resultTitle)) return false

  const formattedTitle = normalizeTerm(title)
  const formattedResultTitle = normalizeTerm(resultTitle)

  if (volumePattern.test(title)) {
    return title === resultTitle
  } else {
    return stringsAreClose(formattedTitle, formattedResultTitle)
  }
}

// Conservative assumption: consider any title with a number to potentially be a volume title
// and thus be more strict in those cases
const volumePattern = /\d+/

module.exports = { matchAuthor, matchTitle }
