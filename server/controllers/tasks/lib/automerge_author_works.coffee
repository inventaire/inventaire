__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesList = __.require 'controllers', 'entities/lib/get_entities_list'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = (authorUri)->
  getAuthorWorksByDomain authorUri
  .then findMergeableWorks
  .then automergeWorks

getAuthorWorksByDomain = (authorUri)->
  getAuthorWorks { uri: authorUri }
  .get 'works'
  .then (works)->
    uris = _.map works, _.property('uri')
    return getEntitiesList uris

findMergeableWorks = (works)->
  { wd: wdWorks, inv: invWorks } = works
    .reduce spreadWorksPerDomain, { wd: [], inv: [] }
  invWorks = invWorks.filter isntSeriePart
  return getPossibleWorksMerge wdWorks, invWorks

spreadWorksPerDomain = (lists, work)->
  prefix = work.uri.split(':')[0]
  lists[prefix].push work
  return lists

isntSeriePart = (work)-> not work.claims['wdt:P179']?

getPossibleWorksMerge = (wdWorks, invWorks)->
  wdWorks = wdWorks.map addNormalizedTerms
  invWorks = invWorks.map addNormalizedTerms
  return _.compact invWorks.map(findPossibleMerge(wdWorks))

findPossibleMerge = (wdWorks)-> (invWork)->
  matches = wdWorks.filter (wdWork)-> haveSomeMatchingTerms invWork, wdWork
  if matches.length is 1 then return [ invWork.uri, matches[0].uri ]

haveSomeMatchingTerms = (invWork, wdWork)->
  for invWorkTerm in invWork.terms
    for wdWorkTerm in wdWork.terms
      if invWorkTerm is wdWorkTerm then return true

  return false

addNormalizedTerms = (work)->
  terms = _.values work.labels
    .concat _.values(work.aliases)
    .map _.toLower
  work.terms = _.uniq terms
  return work

automergeWorks = (mergeableCouples)->
  if mergeableCouples.length is 0 then return

  mergeNext = ->
    nextCouple = mergeableCouples.pop()
    unless nextCouple? then return
    mergeEntities reconcilerUserId, nextCouple...
    .then mergeNext

  return mergeNext()
