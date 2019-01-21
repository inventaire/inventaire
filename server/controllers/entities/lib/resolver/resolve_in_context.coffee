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

addUriToWork = (authors)-> (work)->
  bestWorkLabel = _.values(work.labels)[0]

  Promise.all getWorksFromAuthors(authors, bestWorkLabel)
  .then _.flatten
  .map _.property('uri')
  .then _.uniq
  .then (workUris)->
    # Only one work entity found, then it must match entry work
    if workUris.length is 1
      work.uri = workUris[0]
    return work

getWorksFromAuthors = (authors, workLabel)->
  authors.map (author)->
    unless author.uri then return
    getAuthorWorks({ uri: author.uri }).get 'works'
    .map _.property('uri')
    .then (uris)-> getEntitiesByUris({ uris }).get 'entities'
    .then _.values
    .filter (work)-> workLabel in Object.values(work.labels)
