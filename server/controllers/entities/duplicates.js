// An endpoint to feed client-side entities deduplication interfaces
// with the data it needs. This is an admin-only endpoint as it's queries are
// quite expensive, requiring to parse the whole findHumansHomonymes view
// to sort it by reduced values, which isn't supported by CouchDB
// see https://stackoverflow.com/questions/2817703/sorting-couchdb-views-by-value

const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const designDocName = 'entities_deduplicate'
const db = __.require('db', 'couchdb/base')('entities', designDocName)

module.exports = (req, res) => {
  return getHomonymes()
  .then(responses_.Wrap(res, 'names'))
  .catch(error_.Handler(req, res))
}

const getHomonymes = async () => {
  const { rows } = await db.view(designDocName, 'findHumansHomonymes', { group_level: 1 })
  return rows
  // Filtering-out keys that are only ponctuation or a single letter
  // TODO: delete those erronous entities
  .filter(row => (row.value > 1) && /\w{1}\w+/.test(row.key))
  .sort((a, b) => b.value - a.value)
  .slice(0, 100)
}
