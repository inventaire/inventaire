const buildInvertedClaimTree = require('./build_inverted_claim_tree')
const { getTimestampItemId, byTimestamp } = require('./items_by_date')

module.exports = items => entitiesData => {
  const { works, editionWorkMap } = entitiesData
  const worksTree = buildInvertedClaimTree(works)
  const workUriItemsMap = items.reduce(buildWorkUriItemsMap(editionWorkMap), {})
  // Pre-sort, as that saves a fair amount of time when re-sorting aggregated timestampedItemsIds,
  // and this present sorting operation is cached
  // See https://gist.github.com/maxlath/7d5a2740616fd05d6eee7225ec6da2d1
  const timestampedItemsIds = items.map(getTimestampItemId).sort(byTimestamp)
  return { worksTree, workUriItemsMap, timestampedItemsIds }
}

const buildWorkUriItemsMap = editionWorkMap => (workUriItemsMap, item) => {
  const { _id: itemId, entity: itemEntityUri } = item
  const itemWorksUris = editionWorkMap[itemEntityUri] || [ itemEntityUri ]
  for (const workUri of itemWorksUris) {
    workUriItemsMap[workUri] = workUriItemsMap[workUri] || []
    workUriItemsMap[workUri].push(itemId)
  }
  return workUriItemsMap
}
