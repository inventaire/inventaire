__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getEntitiesList = __.require 'controllers', 'entities/lib/get_entities_list'
getEntityNormalizedTerms = __.require 'controllers', 'entities/lib/get_entity_normalized_terms'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = (authorUri)->
  getAuthorWorksByDomain authorUri
  .then findMergeableWorks
  .then automergeWorks(authorUri)

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

addNormalizedTerms = (work)->
  work.terms = getEntityNormalizedTerms work
  return work

findPossibleMerge = (wdWorks)-> (invWork)->
  matches = wdWorks.filter haveSomeMatchingTerms(invWork)
  if matches.length is 1 then return [ invWork.uri, matches[0].uri ]

haveSomeMatchingTerms = (invWork)-> (wdWork)-> _.haveAMatch invWork.terms, wdWork.terms

automergeWorks = (authorUri)-> (mergeableCouples)->
  if mergeableCouples.length is 0 then return

  _.log mergeableCouples, "automerging works from author #{authorUri}"

  mergeNext = ->
    nextCouple = mergeableCouples.pop()
    unless nextCouple? then return
    mergeEntities reconcilerUserId, nextCouple...
    .then mergeNext

  return mergeNext()
