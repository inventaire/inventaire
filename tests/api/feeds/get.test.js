const CONFIG = require('config')
const __ = CONFIG.universalPath
const { Promise } = __.require('lib', 'promises')
require('should')
const { nonAuthReq, getUser } = require('../utils/utils')
const { createItem } = require('../fixtures/items')

describe('feeds:get', () => {
  it('should return a user RSS feed', done => {
    getUser()
    .then(user => {
      const userId = user._id
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(res => {
        res.startsWith('<?xml').should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should return a user RSS feed when the user has an item', done => {
    const userPromise = getUser()
    const itemPromise = createItem(userPromise)

    Promise.all([
      userPromise,
      itemPromise
    ])
    .spread((user, item) => {
      const userId = user._id
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(res => {
        res.includes(item._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should not return private items when not authorized', done => {
    const userPromise = getUser()
    const itemAPromise = createItem(userPromise, { listing: 'private' })
    const itemBPromise = createItem(userPromise, { listing: 'network' })

    Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    .spread((user, itemA, itemB) => {
      const userId = user._id
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(res => {
        res.startsWith('<?xml').should.be.true()
        res.includes(itemA._id).should.be.false()
        res.includes(itemB._id).should.be.false()
        done()
      })
    })
    .catch(done)
  })

  it('should return private items when authorized', done => {
    const userPromise = getUser()
    const itemAPromise = createItem(userPromise, { listing: 'private' })
    const itemBPromise = createItem(userPromise, { listing: 'network' })

    Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    .spread((user, itemA, itemB) => {
      const { _id: userId, readToken: token } = user
      return nonAuthReq('get', `/api/feeds?user=${userId}&requester=${userId}&token=${token}`)
      .then(res => {
        res.startsWith('<?xml').should.be.true()
        res.includes(itemA._id).should.be.true()
        res.includes(itemB._id).should.be.true()
        done()
      })
    })
    .catch(done)
  })
})
