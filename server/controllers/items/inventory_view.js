import _ from '#builders/utils'
import error_ from '#lib/error/error'
import getEntitiesByUris from '#controllers/entities/lib/get_entities_by_uris'
import shelves_ from '#controllers/shelves/lib/shelves'
import replaceEditionsByTheirWork from './lib/view/replace_editions_by_their_work.js'
import bundleViewData from './lib/view/bundle_view_data.js'
import getAuthorizedItems from './lib/get_authorized_items.js'

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true },
  'without-shelf': { optional: true, generic: 'boolean' }
}

const controller = async params => {
  validateUserOrGroup(params)
  const items = await getItems(params)
  const entitiesData = await getItemsEntitiesData(items)
  return bundleViewData(items, entitiesData)
}

const validateUserOrGroup = params => {
  if (!(params.user || params.group || params.shelf)) {
    throw error_.newMissingQuery('user|group|shelf', 400, params)
  }
}

const getItems = async params => {
  const { user: userId, group: groupId, shelf: shelfId, reqUserId, 'without-shelf': withoutShelf } = params
  if (userId) {
    return getAuthorizedItems.byUsers([ userId ], reqUserId, { withoutShelf })
  } else if (shelfId) {
    const shelfDoc = await shelves_.byId(shelfId)
    return getAuthorizedItems.byShelves([ shelfDoc ], reqUserId)
  } else {
    return getAuthorizedItems.byGroup(groupId, reqUserId)
  }
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(_.map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .then(({ entities }) => entities)
  .then(replaceEditionsByTheirWork)
}

export default { sanitization, controller }
