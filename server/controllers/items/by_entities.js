import { getItemsByEntities } from '#controllers/items/lib/items'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import { filterPrivateAttributes } from './lib/filter_private_attributes.js'
import { addAssociatedData, paginate } from './lib/queries_commons.js'

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true },
}

const controller = async params => {
  const { uris, reqUserId } = params
  const foundItems = await getItemsByEntities(uris)
  const authorizedItems = await filterVisibleDocs(foundItems, reqUserId)
  const page = paginate(authorizedItems, params)
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}

export default { sanitization, controller }
