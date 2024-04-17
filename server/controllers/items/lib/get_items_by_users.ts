import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { addAssociatedData, paginateItems } from './queries_commons.js'

export async function getItemsByUsers (params) {
  const { reqUserId, usersIds } = params

  // Possible optimization:
  // - fetching only ids and item creation date (as view values)
  // - sort and paginate on those ids+timestamp
  // - fetch remaining docs
  // Limitation: the paginate function might need to filter on items visibility
  const authorizedItems = await getAuthorizedItemsByUsers(usersIds, reqUserId)
  const page = paginateItems(authorizedItems, params)
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}
