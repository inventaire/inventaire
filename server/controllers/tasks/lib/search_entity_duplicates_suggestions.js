const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const search = __.require('controllers', 'search/lib/get_wd_authors')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')

module.exports = (entity, existingTasks) => {
  const name = _.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) return

  return search(name, { type: 'humans' })
  .then(searchResult => {
    return searchResult
    .filter(result => result._score > 4)
    .map(formatResult)
  })
  .catch(_.ErrorRethrow(`${name} search err`))
}

const formatResult = result => ({
  _score: result._score,
  uri: prefixifyWd(result.id)
})
