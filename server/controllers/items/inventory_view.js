const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const getAuthorizationLevel = require('./lib/get_authorization_level')
const getInventoryView = require('./lib/view/get_inventory_view')
const { getItemsByDate } = require('./lib/view/items_by_date')

const sanitization = {
  user: { optional: true },
  group: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(validateUserOrGroup)
  .then(getInventoryViewsParams)
  .then(getInventoryViews)
  .then(mergeInventoryViews)
  .then(generateItemsByDateList)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const validateUserOrGroup = params => {
  if (!(params.user || params.group)) {
    throw error_.newMissingQuery('user|group', 400, params)
  }
  return params
}

const getInventoryViewsParams = params => {
  const { user, group, reqUserId } = params
  if (user) return getAuthorizationLevel.byUser(user, reqUserId)
  else return getAuthorizationLevel.byGroup(group, reqUserId)
}

const getInventoryViews = ({ authorizationLevel, usersIds }) => {
  return Promise.all(usersIds.map(userId => getInventoryView(userId, authorizationLevel)))
}

const mergeInventoryViews = inventoryViews => {
  if (inventoryViews.length === 1) return inventoryViews[0]
  return _.mergeWith(...inventoryViews, concatArraysCustomizer)
}

// Source: https://lodash.com/docs/4.17.15#mergeWith example
const concatArraysCustomizer = (objValue, srcValue) => {
  if (_.isArray(objValue)) return objValue.concat(srcValue)
}

const generateItemsByDateList = inventoryView => {
  inventoryView.itemsByDate = getItemsByDate(inventoryView.timestampedItemsIds)
  delete inventoryView.timestampedItemsIds
  return inventoryView
}
