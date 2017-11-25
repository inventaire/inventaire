const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const items_ = require('./lib/items')
const { getNetworkIds } = __.require('controllers', 'user/lib/relations_status')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const getByAccessLevel = require('./lib/get_by_access_level')
const replaceEditionsByTheirWork = require('./lib/view/replace_editions_by_their_work')
const bundleViewData = require('./lib/view/bundle_view_data')

module.exports = (req, res) => {
  const { _id: reqUserId } = req.user

  getAllNetworkItems(reqUserId)
  .then(items => {
    return getItemsEntitiesData(items)
    .then(bundleViewData(items))
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const getAllNetworkItems = reqUserId => {
  return user_.getNetworkIds(reqUserId)
  .then(getItems(reqUserId))
  .then(_.flatten)
}

const getItems = reqUserId => ids => {
  return promises_.all([
    items_.byOwner(reqUserId),
    getByAccessLevel.network(ids, reqUserId)
  ])
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(items.map(_.property('entity')))
  return getEntitiesByUris({ uris })
  .get('entities')
  .then(replaceEditionsByTheirWork)
}
