CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require 'lib', 'get_best_lang_value'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = require '../get_entities_by_uris'
{ Promise } = __.require 'lib', 'promises'

module.exports = (entry)->
  { edition, works, authors } = entry
  Promise.all works.map addUriToWork(authors)
  .then ->
    Promise.all authors.map addUriToAuthor(works)

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

getAuthorsFromWorksUris = (uris, authorLabels)->
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
  .then (works)->
    authorClaims = works.map (work)-> work.claims['wdt:P50']
    authorUris = _.flatten authorClaims
  .then (uris)-> getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
  .filter (existingAuthor)->
    authorsLabels = Object.values(existingAuthor.labels)
    _.intersection(authorLabels, authorsLabels).length > 0

getWorksFromAuthors = (authorUris, workLabels)->
  authorUris.map (uri)->
    getAuthorWorks { uri }
    .get 'works'
    .map _.property('uri')
    .then (uris)-> getEntitiesByUris({ uris })
    .get 'entities'
    .then _.values
    .filter (existingWork)->
      worksLabels = Object.values(existingWork.labels)
      _.intersection(workLabels, worksLabels).length > 0
