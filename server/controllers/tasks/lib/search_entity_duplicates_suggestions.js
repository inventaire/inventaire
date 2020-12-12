const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')

module.exports = async entity => {
  const name = _.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) return []

  const results = await typeSearch({ search: name, types: [ 'humans' ], filter: 'wd' })

  return results
  .filter(result => result._score > 4)
  .map(result => ({
    _score: result._score,
    uri: result._source.uri,
  }))
}
