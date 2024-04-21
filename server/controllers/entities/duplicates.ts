// An endpoint to feed client-side entities deduplication interfaces
// with the data it needs. This is an admin-only endpoint as it's queries are
// quite expensive, requiring to parse the whole findHumansHomonymes view
// to sort it by reduced values, which isn't supported by CouchDB
// see https://stackoverflow.com/questions/2817703/sorting-couchdb-views-by-value

import dbFactory from '#db/couchdb/base'

const designDocName = 'entities_deduplicate'
const db = await dbFactory('entities', designDocName)

async function controller () {
  const names = await getHomonymes()
  return { names }
}

async function getHomonymes () {
  const { rows } = await db.view(designDocName, 'findHumansHomonymes', { group_level: 1 })
  return rows
  // Filtering-out keys that are only ponctuation or a single letter
  // TODO: delete those erronous entities
  .filter(row => {
    if (typeof row.value !== 'number') return false
    return (row.value > 1) && /\w{2,}/.test(row.key)
  })
  .sort((a, b) => +b.value - +a.value)
  .slice(0, 100)
}

export default { sanitization: {}, controller }
