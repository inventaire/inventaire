const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq } = __.require('apiTests', 'utils/utils')
const { createEditionAndItem } = require('../fixtures/items')

const endpoint = '/api/items?action=inventory-view'

describe('items:inventory-view', async () => {
  it('should get a works tree, work items map and items by date', async () => {
    const res = await authReq('get', endpoint)
    res.worksTree.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
  })

  it('should get corresponding works and items', async () => {
    const user = await getUser()
    const item = await createEditionAndItem()
    const { worksTree, workUriItemsMap, itemsByDate } = await authReq('get', endpoint)
    worksTree['wdt:P50'].should.be.an.Object()
    worksTree['wdt:P50'].unknown.should.be.an.Array()
    const ownerObject = worksTree.owner[user._id]
    const itemsIds = _.flatten(Object.values(ownerObject))
    itemsIds.should.containEql(item._id)
    const worksObject = _.flatten(_.values(workUriItemsMap))
    worksObject.should.containEql(item._id)
    itemsByDate.should.containEql(item._id)
  })
})
