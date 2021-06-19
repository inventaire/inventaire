const _ = require('builders/utils')
const error_ = require('lib/error/error')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')
const replaceEditionsByTheirWork = require('./lib/view/replace_editions_by_their_work')
const bundleViewData = require('./lib/view/bundle_view_data')
const getAuthorizedItems = require('./lib/get_authorized_items')
const shelves_ = require('controllers/shelves/lib/shelves')

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
  const { user, group, shelf, reqUserId, 'without-shelf': withoutShelf } = params
  if (user) {
    return getAuthorizedItems.byUser(user, reqUserId, { withoutShelf })
  }
  if (shelf) {
    const shelfDoc = await shelves_.byId(shelf)
    return getAuthorizedItems.byShelf(shelfDoc, reqUserId)
  } else {
    return getAuthorizedItems.byGroup(group, reqUserId)
  }
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(_.map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .then(({ entities }) => entities)
  .then(replaceEditionsByTheirWork)
}

module.exports = { sanitization, controller }
