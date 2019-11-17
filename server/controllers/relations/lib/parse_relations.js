// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = res => {
  const relations = _.initCollectionsIndex(relationsTypes)
  for (const row of res.rows) {
    spreadRelation(relations, row)
  }
  return relations
}

const spreadRelation = (relations, row) => {
  // view key looks like userId:relationType
  const type = row.key[1]
  const id = row.value
  if (relationsTypes.includes(type) && (id != null)) {
    return relations[type].push(id)
  } else {
    throw new Error(`spreadRelation err: type=${type}, id=${id}`)
  }
}

const relationsTypes = [
  'friends',
  'userRequested',
  'otherRequested',
  'none'
]
