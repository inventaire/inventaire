const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')
const getAuthorizationLevel = require('./lib/get_authorization_level')
const { getInventoryViews } = require('./lib/view/inventory_view')
const { getItemsByDate } = require('./lib/view/items_by_date')

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  dry: {
    optional: true,
    generic: 'boolean'
  }
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
  const { user, group, reqUserId, dry } = params
  if (user) return getAuthorizationLevel.byUser(user, reqUserId, dry)
  else return getAuthorizationLevel.byGroup(group, reqUserId, dry)
}

const mergeInventoryViews = inventoryViews => {
  if (inventoryViews.length === 1) return inventoryViews[0]
  const mergedInventoryViews = _.mergeWith(...inventoryViews, concatArraysCustomizer)
  deduplicateWorksTree(mergedInventoryViews.worksTree)
  return mergedInventoryViews
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

const deduplicateWorksTree = worksTree => {
  for (const section in worksTree) {
    for (const key in worksTree[section]) {
      worksTree[section][key] = _.uniq(worksTree[section][key])
    }
  }
}
