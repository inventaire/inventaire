const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const replaceEditionsByTheirWork = require('./lib/view/replace_editions_by_their_work')
const bundleViewData = require('./lib/view/bundle_view_data')
const sanitize = __.require('lib', 'sanitize/sanitize')
const getAuthorizedItems = require('./lib/get_authorized_items')

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(validateUserOrGroup)
  .then(getItems)
  .then(items => {
    return getItemsEntitiesData(items)
    .then(bundleViewData(items))
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const validateUserOrGroup = params => {
  if (!(params.user || params.group || params.shelf)) {
    throw error_.newMissingQuery('user|group|shelf', 400, params)
  }
  return params
}

const getItems = params => {
  const { user, group, shelf, reqUserId } = params
  if (user) return getAuthorizedItems.byUser(user, reqUserId)
  if (shelf) return getAuthorizedItems.byShelf(shelf, reqUserId)
  else return getAuthorizedItems.byGroup(group, reqUserId)
}

const getItemsEntitiesData = items => {
  const uris = _.uniq(_.map(items, 'entity'))
  return getEntitiesByUris({ uris })
  .then(({ entities }) => entities)
  .then(replaceEditionsByTheirWork)
}
