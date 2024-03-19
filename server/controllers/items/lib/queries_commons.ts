import { map, uniq } from 'lodash-es'
import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'
import { getShelvesByIds } from '#controllers/shelves/lib/shelves'
import { setItemsBusyFlag } from '#controllers/transactions/lib/transactions'
import { getUsersAuthorizedDataByIds } from '#controllers/user/lib/user'
import { isVisibilityGroupKey } from '#lib/boolean_validations'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { Item } from '#types/item'

const addUsersData = async (page, reqParams) => {
  const { reqUserId, includeUsers } = reqParams
  if (includeUsers === false) return page

  const { items } = page
  if (items.length === 0) {
    page.users = []
    return page
  }

  const ownersIds = uniq(map(items, 'owner'))

  const users = await getUsersAuthorizedDataByIds(ownersIds, reqUserId)
  page.users = users
  return page
}

export function addItemsSnapshots (items) {
  return Promise.all(items.map(addSnapshotToItem))
}

export async function addAssociatedData (page, reqParams) {
  await Promise.all([
    addItemsSnapshots(page.items),
    addUsersData(page, reqParams),
    setItemsBusyFlag(page.items),
    removeUnauthorizedShelves(page.items, reqParams.reqUserId),
  ])
  return page
}

async function removeUnauthorizedShelves (items, reqUserId) {
  const shelvesIds = uniq(map(items, 'shelves').flat())
  const shelves = await getShelvesByIds(shelvesIds)
  const authorizedShelves = await filterVisibleDocs(shelves, reqUserId)
  const authorizedShelvesIds = new Set(map(authorizedShelves, '_id'))
  for (const item of items) {
    item.shelves = item.shelves.filter(shelfdId => authorizedShelvesIds.has(shelfdId))
  }
}

export interface ItemsPageParams {
  limit?: number
  offset?: number
  context?: string
}

export interface ItemsPage {
  items: Item[]
  total: number
  offset?: number
  context?: string
  continue?: number
}

export function paginate (items: Item[], params: ItemsPageParams) {
  let { limit, offset, context } = params
  items = items.sort(byCreationDate)
  if (context != null) {
    items = items.filter(canBeDisplayedInContext(context))
  }
  const total = items.length
  if (offset == null) offset = 0
  const last = offset + limit

  if (limit != null) {
    items = items.slice(offset, last)
    const data: ItemsPage = { items, total, offset, context }
    if (last < total) data.continue = last
    return data
  } else {
    return { items, total, offset, context }
  }
}

const byCreationDate = (a, b) => b.created - a.created

const canBeDisplayedInContext = context => item => {
  if (isVisibilityGroupKey(context)) {
    const { visibility } = item
    if (visibility.includes('public') || visibility.includes('groups') || visibility.includes(context)) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}
