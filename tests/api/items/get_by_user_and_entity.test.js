const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq } = __.require('apiTests', 'utils/utils')
const { createItem, createEditionAndItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { Promise } = __.require('lib', 'promises')

const endpoint = '/api/items?action=by-user-and-entity'

describe('items:get-by-user-and-entity', () => {
  it('should get an item by its owner id and entity uri', done => {
    createItem(getUser())
    .then(item => {
      return authReq('get', `${endpoint}&user=${item.owner}&uri=${item.entity}`)
      .then(res => {
        const itemsIds = _.map(res.items, '_id')
        itemsIds.includes(item._id).should.be.true()
        for (const resItem of res.items) {
          resItem.entity.should.equal(item.entity)
          resItem.owner.should.equal(item.owner)
        }
        done()
      })
    })
    .catch(done)
  })

  it('should not get items of not requested entity uris', done => {
    Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(getUser())
    ])
    .spread(userItem => {
      const { owner, entity: uri } = userItem
      return authReq('get', `${endpoint}&user=${owner}&uri=${uri}`)
      .then(res => {
        res.items.length.should.equal(1)
        done()
      })
    })
    .catch(done)
  })

  it('should get items by their owner id', done => {
    Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(createUser())
    ])
    .spread(userItem => {
      const { owner, entity: uri } = userItem
      return authReq('get', `${endpoint}&user=${owner}&uri=${uri}`)
      .then(res => {
        res.items.length.should.equal(1)
        res.items[0].should.deepEqual(userItem)
        done()
      })
    })
    .catch(done)
  })

  it('should get items by their entity uri', done => {
    createEditionAndItem(getUser())
    .then(itemA => {
      const uri = itemA.entity
      return createItem(getUser(), { entity: uri })
      .then(itemB => {
        return authReq('get', `${endpoint}&user=${itemA.owner}&uri=${uri}`)
        .then(res => {
          const itemsIds = [ itemA._id, itemB._id ]
          const resItemsIds = _.map(res.items, '_id')
          resItemsIds.should.containDeep(itemsIds)
          done()
        })
      })
    })
    .catch(done)
  })
})
