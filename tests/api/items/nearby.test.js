const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Wait } = __.require('lib', 'promises')
const { getUserGetter, customAuthReq } = __.require('apiTests', 'utils/utils')
const { createItem } = require('../fixtures/items')
const geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().then(Wait(1000))
const geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 2, 2 ] })().then(Wait(1000))
const endpoint = '/api/items?action=nearby'

describe('items:nearby', () => {
  it('should get items nearby', done => {
    createItem(geolocatedUser1Promise)
    .then(Wait(500))
    .then(item => {
      return customAuthReq(geolocatedUser2Promise, 'get', endpoint)
      .then(res => {
        const itemsIds = _.map(res.items, '_id')
        itemsIds.includes(item._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should accept a range', done => {
    createItem(geolocatedUser1Promise)
    .then(Wait(500))
    .then(item => {
      return customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1&strict-range=true`)
      .then(res => {
        const itemsIds = _.map(res.items, '_id')
        itemsIds.includes(item._id).should.be.false()
        done()
      })
    })
    .catch(done)
  })
})
