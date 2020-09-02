const __ = require('config').universalPath
const refreshInventoryViewsFromEntity = __.require('controllers', 'items/lib/view/refresh_inventory_views_from_entity')

module.exports = (user, uri, property, oldVal, newVal) => {
  const [ prefix, id ] = uri.split(':')
  const updater = updaters[prefix]
  return updater(user, id, property, oldVal, newVal)
  .then(() => { refreshInventoryViewsFromEntity(property, uri) })
}

const updaters = {
  // TODO: accept ISBN URIs
  inv: require('./update_inv_claim'),
  wd: require('./update_wd_claim')
}
