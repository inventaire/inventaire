import items_ from 'controllers/items/lib/items'
import { addAssociatedData, paginate } from './lib/queries_commons'
import { filterPrivateAttributes } from './lib/filter_private_attributes'
import filterVisibleDocs from 'lib/visibility/filter_visible_docs'

const sanitization = {
  user: {},
  uris: {},
  limit: { optional: true },
  offset: { optional: true },
  // 'users' is pluralize to be consistent with flags on other items endpoints
  'include-users': {
    generic: 'boolean',
    default: false
  }
}

const controller = async params => {
  const { userId, uris, reqUserId } = params
  const foundItems = await items_.byOwnerAndEntities(userId, uris)
  const authorizedItems = await filterVisibleDocs(foundItems, reqUserId)
  const page = paginate(authorizedItems, params)
  page.items = page.items.map(filterPrivateAttributes(reqUserId))
  return addAssociatedData(page, params)
}

export default { sanitization, controller }
