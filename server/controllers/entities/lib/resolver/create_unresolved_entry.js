const { createEdition, createWork, createAuthor } = require('./create_entity_from_seed')

module.exports = params => async entry => {
  const { reqUserId: userId, batchId } = params
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
  return createAuthors(entry, userId, batchId)
  // Idem for works being created before the edition
  .then(() => createWorks(entry, userId, batchId))
  .then(() => createEdition(edition, works, userId, batchId))
  .then(() => entry)
}

const createAuthors = (entry, userId, batchId) => {
  const { authors } = entry
  return Promise.all(authors.map(createAuthor(userId, batchId)))
}

const createWorks = (entry, userId, batchId) => {
  const { works, authors } = entry
  return Promise.all(works.map(createWork(userId, batchId, authors)))
}

const addNotCreatedFlag = seed => {
  seed.created = false
}
