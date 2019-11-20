
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const { populate } = require('../fixtures/populate')
const lastPublicUrl = '/api/items?action=last-public'

describe('items:last-public', () => {
  it('can take an limit parameter', done => {
    const limit = 2
    populate({
      usersCount: 1,
      publicItemsPerUser: limit + 1
    })
    .then(() => nonAuthReq('get', `${lastPublicUrl}&limit=${limit}`))
    .then(res => {
      res.items.length.should.equal(limit)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should fetch 15 last-public items', done => {
    populate({
      usersCount: 1,
      publicItemsPerUser: 16
    })
    .then(() => nonAuthReq('get', lastPublicUrl))
    .then(res => {
      res.items.length.should.equal(15)
      done()
    })
    .catch(undesiredErr(done))
  })
})
