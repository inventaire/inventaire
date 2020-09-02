const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = __.require('controllers', 'entities/lib/entities')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const { prefixifyInv } = __.require('controllers', 'entities/lib/prefix')
const items_ = __.require('controllers', 'items/lib/items')
const propsAffectingInventoryView = {
  edition: [ 'wdt:P629' ],
  work: [ 'wdt:P921', 'wdt:P136', 'wdt:P50' ]
}
const { refreshInventoryViews } = require('./inventory_view')

module.exports = async (property, uri) => {
  const entity = await getEntityByUri({ uri })
  let editionsUris = []
  if (entity.type === 'edition') {
    if (!_.includes(propsAffectingInventoryView.edition, property)) return
    editionsUris = [ entity.uri ]
  }
  if (entity.type === 'work') {
    if (!_.includes(propsAffectingInventoryView.work, property)) return
    editionsUris = await getEditionsUris(uri)
  }
  if (_.isEmpty(editionsUris)) return
  return items_.byEditions(editionsUris)
  .then(refreshOwnersInventoryViews)
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
