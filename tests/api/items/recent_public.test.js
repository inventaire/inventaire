const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { nonAuthReq, undesiredRes } = __.require('apiTests', 'utils/utils')
const { Wait } = __.require('lib', 'promises')
const { populate } = require('../fixtures/populate')
const recentPublicUrl = '/api/items?action=recent-public'

describe('items:recent-public', () => {
  it('should fetch 15 recent-public items', done => {
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => res.items.length.should.equal(15))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should fetch items from different owners', done => {
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => res.users.length.should.be.above(1))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should take a limit parameter', done => {
    populate()
    .then(() => nonAuthReq('get', `${recentPublicUrl}&limit=3`))
    .then(res => res.items.length.should.equal(3))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should take a lang parameter', done => {
    populate()
    .then(() => nonAuthReq('get', `${recentPublicUrl}&lang=en`))
    .then(res => _.some(res.items, itemLangIs('en')).should.be.true())
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should return some of the most recent items', done => {
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => _.some(res.items, createdLately).should.be.true())
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should reject invalid limit', done => {
    nonAuthReq('get', `${recentPublicUrl}&limit=bla`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid limit: bla')
      done()
    })
    .catch(done)
  })

  it('should reject invalid lang', done => {
    nonAuthReq('get', `${recentPublicUrl}&lang=bla`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid lang: bla')
      done()
    })
    .catch(done)
  })
})

const itemLangIs = lang => item => item.snapshot['entity:lang'] === lang
const createdLately = item => !_.expired(item.created, 120000)
