// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const search = __.require('controllers', 'search/lib/get_wd_authors')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')

module.exports = function(entity, existingTasks){
  const name = _.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) { return }

  return search(name, 'humans')
  .then(searchResult => searchResult
  .filter(result => result._score > 4)
  .map(formatResult)).catch(_.ErrorRethrow(`${name} search err`))
}

var formatResult = result => ({
  _score: result._score,
  uri: prefixifyWd(result.id)
})
