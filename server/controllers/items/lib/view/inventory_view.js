const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const cache_ = __.require('lib', 'cache')
const getByAuthorizationLevel = require('../get_by_authorization_level')
const bundleViewData = require('./bundle_view_data')
const replaceEditionsByTheirWork = require('./replace_editions_by_their_work')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')

const inventoryView_ = module.exports = {
  refreshInventoryViews: ({ usersIds, items }) => {
    // refresh caches assuming usersIds are items owner, beware if not
    const listings = _.map(items, _.property('listing'))
    const authorizationLevels = _.uniq(listings)
    return Promise.all(authorizationLevels.map(authorizationLevel => {
      return inventoryView_.getInventoryViews({
        usersIds,
        authorizationLevel,
        refresh: true
      })
    }))
  },
  getInventoryViews: ({ usersIds, authorizationLevel, refresh, dry }) => {
    return Promise.all(usersIds.map(userId => {
      return getInventoryView({ userId, authorizationLevel, refresh, dry })
    }))
  }
}

const getInventoryView = ({ userId, authorizationLevel, refresh, dry }) => {
  return cache_.get({
    key: `invview:${userId}:${authorizationLevel}`,
    fn: getInventoryViewFn.bind(null, userId, authorizationLevel),
    refresh,
    dry
  })
}

const getInventoryViewFn = (userId, authorizationLevel) => {
  return getByAuthorizationLevel[authorizationLevel](userId)
  .then(items => {
    return getItemsEntitiesData(items)
    .then(bundleViewData(items))
  })
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(_.map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .then(({ entities }) => entities)
  .then(replaceEditionsByTheirWork)
}
