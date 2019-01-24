CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveWork = require './resolve_work'
resolveAuthor = require './resolve_author'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
getWorksFromAuthors = require './get_works_from_authors'
{ Promise } = __.require 'lib', 'promises'

module.exports = (entry)->
  { edition, works, authors } = entry

  resolveEdition edition
  .then -> resolveCollection works, resolveWork
  .then -> resolveCollection authors, resolveAuthor
  .then -> resolveInContext authors, works, addUriToAuthor
  .then -> resolveInContext works, authors, addUriToWork
  .then -> entry

resolveCollection = (entities, addResolvedUri)-> Promise.all entities.map(addResolvedUri)
resolveInContext = (entities, contextEntities, addUriInContext)-> Promise.all entities.map(addUriInContext(contextEntities))

addUriToAuthor = (works)-> (author)->
  workUris = _.compact(works.map(_.property('uri')))
  entryAuthorLabels = _.values(author.labels)
  if author.uri? or _.isEmpty(workUris) then return
  Promise.all getAuthorsFromWorksUris(workUris, entryAuthorLabels)
  .then _.flatten
  .map _.property('uri')
  .then _.uniq
  .then (authorUris)->
    # Only one author entity found, then it must match entry author
    if authorUris.length is 1
      author.uri = authorUris[0]

addUriToWork = (authors)-> (work)->
  authorUris = _.compact(authors.map(_.property('uri')))
  entryWorkLabels = _.values(work.labels)
  if work.uri? or _.isEmpty(authorUris) then return
  Promise.all getWorksFromAuthors(authorUris, entryWorkLabels)
  .then _.flatten
  .map _.property('uri')
  .then _.uniq
  .then (workUris)->
    # Only one work entity found, then it must match entry work
    if workUris.length is 1
      work.uri = workUris[0]
