CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
typeSearch_ = __.require 'controllers', 'search/lib/type_search'
parseResults = __.require 'controllers', 'search/lib/parse_results'

module.exports = (works)-> (author)->
  worksToResolve = _.reject works, 'uri'
  if _.isEmpty(worksToResolve) then return
  authorLabels = _.values(author.labels)
  types = [ 'humans' ]

  searchEntityByLabels(authorLabels, types)
  .then (authorUris)->
    Promise.all worksToResolve.map (work)->
      if author.uri? or work.uri? then return
      worksLabels = _.uniq(_.values(work.labels))
      Promise.all getWorksFromAuthorsUris(authorUris, worksLabels)
      .then _.flatten
      .then (works)->
        if works.length is 1
          author.uri = authorUris[0]
          work.uri = works[0].uri

searchEntityByLabels = (labels, types)->
  Promise.all labels.map (label)->
    typeSearch_ types, label
    .then parseResults(types)
    .filter (hit)-> label in _.values(hit._source.labels)
    .map (hit)-> hit._source.uri
    .then _.compact
  .then _.flatten
  .then _.uniq