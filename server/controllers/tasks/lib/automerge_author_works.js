const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities')
const getAuthorWorks = __.require('controllers', 'entities/lib/get_author_works')
const getEntitiesList = __.require('controllers', 'entities/lib/get_entities_list')
const { getEntityNormalizedTerms } = __.require('controllers', 'entities/lib/terms_normalization')
const { _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = authorUri => {
  return getAuthorWorksByDomain(authorUri)
  .then(findMergeableWorks)
  .then(automergeWorks(authorUri))
}

const getAuthorWorksByDomain = authorUri => {
  return getAuthorWorks({ uri: authorUri })
  .then(({ works }) => works)
  .then(works => {
    const uris = _.map(works, _.property('uri'))
    return getEntitiesList(uris)
  })
}

const findMergeableWorks = works => {
  let { wd: wdWorks, inv: invWorks } = works
    .reduce(spreadWorksPerDomain, { wd: [], inv: [] })
  invWorks = invWorks.filter(isntSeriePart)
  return getPossibleWorksMerge(wdWorks, invWorks)
}

const spreadWorksPerDomain = (lists, work) => {
  const prefix = work.uri.split(':')[0]
  lists[prefix].push(work)
  return lists
}

const isntSeriePart = work => work.claims['wdt:P179'] == null

const getPossibleWorksMerge = (wdWorks, invWorks) => {
  wdWorks = wdWorks.map(addNormalizedTerms)
  invWorks = invWorks.map(addNormalizedTerms)
  return _.compact(invWorks.map(findPossibleMerge(wdWorks)))
}

const addNormalizedTerms = work => {
  work.terms = getEntityNormalizedTerms(work)
  return work
}

const findPossibleMerge = wdWorks => invWork => {
  const matches = wdWorks.filter(haveSomeMatchingTerms(invWork))
  if (matches.length === 1) return [ invWork.uri, matches[0].uri ]
}

const haveSomeMatchingTerms = invWork => wdWork => _.someMatch(invWork.terms, wdWork.terms)

const automergeWorks = authorUri => mergeableCouples => {
  if (mergeableCouples.length === 0) return

  _.log(mergeableCouples, `automerging works from author ${authorUri}`)

  const mergeNext = () => {
    const nextCouple = mergeableCouples.pop()
    if (nextCouple == null) return
    return mergeEntities(reconcilerUserId, ...nextCouple)
    .then(mergeNext)
  }

  return mergeNext()
}
