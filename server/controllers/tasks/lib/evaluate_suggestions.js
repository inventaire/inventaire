
const __ = require('config').universalPath
const automerge = require('./automerge')
const { getEntityNormalizedTerms } = __.require('controllers', 'entities/lib/terms_normalization')

module.exports = (suspect, workLabels) => suggestions => {
  const suspectTerms = getEntityNormalizedTerms(suspect)
  // Do not automerge if author name is in work title
  // as it confuses occurences finding on WP pages
  if (authorNameInWorkTitles(suspectTerms, workLabels)) return suggestions
  const sourcedSuggestions = findSourced(suggestions)
  if (sourcedSuggestions.length === 0) return suggestions
  if (sourcedSuggestions.length > 1) return sourcedSuggestions
  return automerge(suspect.uri, sourcedSuggestions[0])
}

const authorNameInWorkTitles = (authorTerms, workLabels) => {
  for (const authorLabel of authorTerms) {
    for (const workLabel of workLabels) {
      if (workLabel.match(authorLabel)) return true
    }
  }
  return false
}

const findSourced = suggestions => suggestions.filter(sug => sug.occurrences.length > 0)
