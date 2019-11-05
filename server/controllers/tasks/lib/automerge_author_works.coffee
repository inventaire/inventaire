__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = (authorUri)->
  getAuthorWorks { uri: authorUri }
  .get 'works'
  .then filterMergeableWorks
  .then automergeWorks

filterMergeableWorks = (works)->
  uris = _.map(works, _.property('uri'))
  getEntitiesByUris { uris }
  .get 'entities'
  .then rejectSerieWorks
  .then getPossibleWorksMerge
  .then filterDuplicatedMerge

rejectSerieWorks = (works)->
  _.mapValues works, (work)->
    if work.claims['wdt:P179'] then return
    work

getPossibleWorksMerge = (works)->
  possibleMerge = _.mapValues(works, -> [])
  _.mapValues works, (work)->
    unless work then return
    { uri:workUri } = work
    workLabels = _.values work.labels
    _.mapValues works, (work2)->
      unless work2 then return
      { uri:work2Uri } = work2
      work2Labels = _.values work2.labels
      findPossibleMerge(workUri, workLabels, work2Uri, work2Labels, possibleMerge)
  possibleMerge

findPossibleMerge = (workUri, workLabels, work2Uri, work2Labels, possibleMerge)->
  if work2Uri is workUri then return
  if _.includes possibleMerge[work2Uri], workUri then return
  if _.some _.intersection(workLabels, work2Labels)
    possibleMerge[workUri].push work2Uri

filterDuplicatedMerge = (possibleWorksMerge)->
  _.mapValues possibleWorksMerge, (toUris)->
    if _.isEmpty(toUris) then return
    for fromUri2, toUris2 of possibleWorksMerge
      unless _.isWdEntityUri fromUri2
        cleanedtoUris = _.difference toUris, toUris2
        possibleWorksMerge[fromUri2] = cleanedtoUris
  possibleWorksMerge

automergeWorks = (worksToMerge)->
  for fromUri, toUris of worksToMerge
    _.map toUris, (toUri)->
      mergeEntities reconcilerUserId, toUri, fromUri
