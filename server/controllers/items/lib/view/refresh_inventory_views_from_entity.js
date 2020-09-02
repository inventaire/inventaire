const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = __.require('controllers', 'entities/lib/entities')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const { prefixifyInv } = __.require('controllers', 'entities/lib/prefix')
const items_ = __.require('controllers', 'items/lib/items')
const propsAffectingInventoryView = [ 'wdt:P921', 'wdt:P136', 'wdt:P50' ]
const { refreshInventoryViews } = require('./inventory_view')

module.exports = async (property, uri) => {
  const entity = await getEntityByUri({ uri })
  if (!_.includes(propsAffectingInventoryView, property)) return
  if (entity.type === 'work') {
    const editionsUris = await getEditionsUris(uri)
    return items_.byEditions(editionsUris)
    .then(refreshOwnersInventoryViews)
  }
}

const refreshOwnersInventoryViews = items => {
  const owners = _.map(items, _.property('owner'))
  return refreshInventoryViews({
    usersIds: owners,
    items
  })
}

const getEditionsUris = async uri => {
  const res = await entities_.byClaim('wdt:P629', uri)
  return _.map(res.rows, row => {
    return prefixifyInv(row.id)
  })
}
