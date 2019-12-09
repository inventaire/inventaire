const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq } = __.require('apiTests', 'utils/utils')
const { createEditionAndItem } = require('../fixtures/items')

const endpoint = '/api/items?action=inventory-view'

describe('items:get-by-user-and-entity', async () => {
  it('should get a works tree, work items map and items by date', async () => {
    const res = await authReq('get', endpoint)
    res.worksTree.should.be.an.Object()
    res.worksTree.owner.should.be.an.Object()
    res.workUriItemsMap.should.be.an.Object()
    res.itemsByDate.should.be.an.Array()
  })

  it('should get corresponding works and items', async () => {
    const item = await createEditionAndItem(getUser())
    const res = await authReq('get', endpoint)
    res.worksTree['wdt:P50'].should.be.an.Object()
    res.worksTree['wdt:P50'].unknown.should.be.an.Array()

    const ownerObject = _.values(res.worksTree.owner)[0]
    _.values(ownerObject)[0].should.containEql(item._id)

    const worksObject = _.values(res.workUriItemsMap)[0]
    worksObject.should.containEql(item._id)
    res.itemsByDate.should.containEql(item._id)
  })
})
