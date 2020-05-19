const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq } = __.require('apiTests', 'utils/utils')
const { createItem, createItemWithEditionAndWork } = require('../fixtures/items')

describe('items:get-by-entities', () => {
  it('should get an item by its entity uri', done => {
    createItem(getUser())
    .then(item => {
      return authReq('get', `/api/items?action=by-entities&uris=${item.entity}`)
      .then(res => {
        res.items[0].entity.should.equal(item.entity)
        done()
      })
    })
    .catch(done)
  })

  it('should get items by entities uris', done => {
    Promise.all([
      createItemWithEditionAndWork(getUser()),
      createItemWithEditionAndWork(getUser())
    ])
    .then(items => {
      const uris = _.uniq(_.map(items, 'entity'))
      return authReq('get', `/api/items?action=by-entities&uris=${uris.join('|')}`)
      .then(res => {
        const resUserIds = _.uniq(_.map(res.items, 'entity'))
        resUserIds.should.containDeep(uris)
        done()
      })
    })
    .catch(done)
  })
})
