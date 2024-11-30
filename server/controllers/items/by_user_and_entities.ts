import { getItemsByOwnerAndEntities } from '#controllers/items/lib/items'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import { filterPrivateAttributes } from './lib/filter_private_attributes.js'
import { addAssociatedData, paginateItems } from './lib/queries_commons.js'

const sanitization = {
  user: {},
  uris: {},
  limit: { optional: true },
  offset: { optional: true },
  // 'users' is pluralize to be consistent with flags on other items endpoints
  'include-users': {
    generic: 'boolean',
    default: false,
  },
}

async function controller (params: SanitizedParameters) {
  const { userId, uris, limit, offset, reqUserId } = params
  const foundItems = await getItemsByOwnerAndEntities(userId, uris)
  const authorizedItems = await filterVisibleDocs(foundItems, reqUserId)
  const page = paginateItems(authorizedItems, { limit, offset })
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}

export default { sanitization, controller }
