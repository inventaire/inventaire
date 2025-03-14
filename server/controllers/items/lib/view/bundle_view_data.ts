import { property } from 'lodash-es'
import type { Item } from '#types/item'
import { buildInvertedClaimTree } from './build_inverted_claim_tree.js'

export function bundleViewData (items: Item[], entitiesData) {
  const { works, editionWorkMap } = entitiesData
  const worksTree = buildInvertedClaimTree(works)
  const workUriItemsMap = items.reduce(buildWorkUriItemsMap(editionWorkMap), {})
  const itemsByDate = getItemsIdsByDate(items)
  const totalItems = itemsByDate.length
  const worksByOwner = items.reduce(aggregateOwnersWorks(editionWorkMap), {})
  worksTree.owner = worksByOwner
  return { worksTree, workUriItemsMap, itemsByDate, totalItems }
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

const aggregateOwnersWorks = editionWorkMap => (index, item) => {
  const { _id: itemId, owner: ownerId, entity: entityUri } = item
  const worksUris = editionWorkMap[entityUri] || [ entityUri ]
  index[ownerId] = index[ownerId] || {}
  for (const workUri of worksUris) {
    index[ownerId][workUri] = index[ownerId][workUri] || []
    index[ownerId][workUri].push(itemId)
  }
  return index
}

function getItemsIdsByDate (items) {
  return items
  .sort(sortByCreationDate)
  .map(getId)
}

const getId = property('_id')
const sortByCreationDate = (a, b) => b.created - a.created
