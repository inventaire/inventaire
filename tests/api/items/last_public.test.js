const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq } = require('apiTests/utils/utils')
const { populate } = require('../fixtures/populate')
const lastPublicUrl = '/api/items?action=last-public'

describe('items:last-public', () => {
  it('can take an limit parameter', done => {
    const limit = 2
    populate({
      usersCount: 1,
      publicItemsPerUser: limit + 1
    })
    .then(() => publicReq('get', `${lastPublicUrl}&limit=${limit}`))
    .then(res => {
      res.items.length.should.equal(limit)
      done()
    })
    .catch(done)
  })

  it('should fetch 15 last-public items', done => {
    populate({
      usersCount: 1,
      publicItemsPerUser: 16
    })
    .then(() => publicReq('get', lastPublicUrl))
    .then(res => {
      res.items.length.should.equal(15)
      done()
    })
    .catch(done)
  })
})
