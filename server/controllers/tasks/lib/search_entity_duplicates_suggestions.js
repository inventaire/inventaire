const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')
// Arbitrarily set, can be changed to better fit the changes in results scores
const lowestSuggestionMatchScore = 4

module.exports = async entity => {
  const name = _.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) return []

  const results = await typeSearch({
    search: name,
    types: [ 'humans' ],
    filter: 'wd',
    minScore: lowestSuggestionMatchScore
  })

  return results.map(formatResult)
}

const formatResult = result => ({
  _score: result._score,
  uri: result._source.uri,
})
