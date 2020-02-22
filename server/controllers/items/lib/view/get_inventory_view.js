const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const cache_ = __.require('lib', 'cache')
const getByAuthorizationLevel = require('../get_by_authorization_level')
const bundleViewData = require('./bundle_view_data')
const replaceEditionsByTheirWork = require('./replace_editions_by_their_work')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')

module.exports = (userId, authorizationLevel) => {
  return cache_.get({
    key: `invview:${userId}:${authorizationLevel}`,
    fn: getInventoryView.bind(null, userId, authorizationLevel)
  })
}

const getInventoryView = (userId, authorizationLevel) => {
  return getByAuthorizationLevel[authorizationLevel](userId)
  .then(items => {
    return getItemsEntitiesData(items)
    .then(bundleViewData(items))
  })
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(_.map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .get('entities')
  .then(replaceEditionsByTheirWork)
}
