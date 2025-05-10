import { getItemsByEntities } from '#controllers/items/lib/items'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { filterPrivateAttributes } from './lib/filter_private_attributes.js'
import { addAssociatedData, paginateItems } from './lib/queries_commons.js'

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true },
} as const

async function controller (params: SanitizedParameters) {
  const { uris, limit, offset, reqUserId } = params
  const foundItems = await getItemsByEntities(uris)
  const authorizedItems = await filterVisibleDocs(foundItems, reqUserId)
  const page = paginateItems(authorizedItems, { limit, offset })
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}

export default { sanitization, controller }
