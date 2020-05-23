const { createEdition, createWork, createAuthor } = require('./create_entity_from_seed')

module.exports = ({ reqUserId, batchId, enrich }) => async entry => {
  const { edition, works, authors } = entry

  // If the edition has been resolved but not its associated works
  // creating new works would make them be created without any associated edition
  if (edition.resolved) {
    works.forEach(addNotCreatedFlag)
    authors.forEach(addNotCreatedFlag)
    return entry
  }

  // Create authors before works, so that the created entities uris
  // can be set on the entry, and used in works claims
  await createAuthors(entry, reqUserId, batchId)
  // Idem for works being created before the edition
  await createWorks(entry, reqUserId, batchId)
  await createEdition(edition, works, reqUserId, batchId, enrich)
  return entry
}

const createAuthors = (entry, reqUserId, batchId) => {
  const { authors } = entry
  return Promise.all(authors.map(createAuthor(reqUserId, batchId)))
}

const createWorks = (entry, reqUserId, batchId) => {
  const { works, authors } = entry
  return Promise.all(works.map(createWork(reqUserId, batchId, authors)))
}

const addNotCreatedFlag = seed => {
  seed.created = false
}
