// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const { createEdition, createWork, createAuthor } = require('./create_entity_from_seed')

module.exports = (userId, batchId) => (function(entry) {
  const { edition, works, authors } = entry

  // If the edition has been resolved but not its associated works
  // creating new works would make them be created without any associated edition
  if (edition.resolved) {
    works.forEach(addNotCreatedFlag)
    authors.forEach(addNotCreatedFlag)
    return Promise.resolve(entry)
  }

  // Create authors before works, so that the created entities uris
  // can be set on the entry, and used in works claims
  return createAuthors(entry, userId, batchId)
  // Idem for works being created before the edition
  .then(() => createWorks(entry, userId, batchId))
  .then(() => createEdition(edition, works, userId, batchId))
  .then(() => entry)
})

var createAuthors = function(entry, userId, batchId){
  const { authors } = entry
  return Promise.all(authors.map(createAuthor(userId, batchId)))
}

var createWorks = function(entry, userId, batchId){
  const { works, authors } = entry
  return Promise.all(works.map(createWork(userId, batchId, authors)))
}

var addNotCreatedFlag = seed => seed.created = false
