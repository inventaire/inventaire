// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const requests_ = __.require('lib', 'requests')
const allDbsUrl = `${CONFIG.db.fullHost()}/_all_dbs`

module.exports = suffix => requests_.get(allDbsUrl)
.filter(isMatchingDatabase(suffix))

const isMatchingDatabase = suffix => {
  const patternString = (suffix != null) ? `^\\w+-${suffix}$` : '^\\w+$'
  const dbNamePattern = new RegExp(patternString)

  return dbName => {
    // Filtering-out _replicator and _users
    if (dbName[0] === '_') return false
    return dbName.match(dbNamePattern)
  }
}
