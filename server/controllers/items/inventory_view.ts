import { map, uniq } from 'lodash-es'
import { getEntitiesByUris } from '#controllers/entities/lib/get_entities_by_uris'
import { getAuthorizedItemsByGroup, getAuthorizedItemsByShelves, getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { getShelfById } from '#controllers/shelves/lib/shelves'
import { newMissingQueryError } from '#lib/error/pre_filled'
import bundleViewData from './lib/view/bundle_view_data.js'
import { replaceEditionsByTheirWork } from './lib/view/replace_editions_by_their_work.js'

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true },
  'without-shelf': { optional: true, generic: 'boolean' },
}

const controller = async params => {
  validateUserOrGroup(params)
  const items = await getItems(params)
  const entitiesData = await getItemsEntitiesData(items)
  return bundleViewData(items, entitiesData)
}

const validateUserOrGroup = params => {
  if (!(params.user || params.group || params.shelf)) {
    throw newMissingQueryError('user|group|shelf')
  }
}

const getItems = async params => {
  const { user: userId, group: groupId, shelf: shelfId, reqUserId, 'without-shelf': withoutShelf } = params
  if (userId) {
    return getAuthorizedItemsByUsers([ userId ], reqUserId, { withoutShelf })
  } else if (shelfId) {
    const shelfDoc = await getShelfById(shelfId)
    return getAuthorizedItemsByShelves([ shelfDoc ], reqUserId)
  } else {
    return getAuthorizedItemsByGroup(groupId, reqUserId)
  }
}

const getItemsEntitiesData = items => {
  const uris = uniq(map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .then(({ entities }) => entities)
  .then(replaceEditionsByTheirWork)
}

export default { sanitization, controller }
