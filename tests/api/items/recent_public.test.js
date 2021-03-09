const _ = require('builders/utils')
require('should')
const { publicReq, undesiredRes } = require('apiTests/utils/utils')
const { Wait } = require('lib/promises')
const { populate } = require('../fixtures/populate')
const { expired } = require('lib/time')
const recentPublicUrl = '/api/items?action=recent-public'

describe('items:recent-public', () => {
  it('should fetch 15 recent-public items', done => {
    populate()
    .then(() => publicReq('get', recentPublicUrl))
    .then(res => res.items.length.should.equal(15))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should fetch items from different owners', done => {
    populate()
    .then(() => publicReq('get', recentPublicUrl))
    .then(res => res.users.length.should.be.above(1))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should take a limit parameter', done => {
    populate()
    .then(() => publicReq('get', `${recentPublicUrl}&limit=3`))
    .then(res => res.items.length.should.equal(3))
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should take a lang parameter', done => {
    populate()
    .then(() => publicReq('get', `${recentPublicUrl}&lang=en`))
    .then(res => _.some(res.items, itemLangIs('en')).should.be.true())
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should return some of the most recent items', done => {
    populate()
    .then(() => publicReq('get', recentPublicUrl))
    .then(res => _.some(res.items, createdLately).should.be.true())
    .then(Wait(10))
    .then(() => done())
    .catch(done)
  })

  it('should reject invalid limit', done => {
    publicReq('get', `${recentPublicUrl}&limit=bla`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid limit: bla')
      done()
    })
    .catch(done)
  })

  it('should reject invalid lang', done => {
    publicReq('get', `${recentPublicUrl}&lang=bla`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('invalid lang: bla')
      done()
    })
    .catch(done)
  })
})

const itemLangIs = lang => item => item.snapshot['entity:lang'] === lang
const createdLately = item => !expired(item.created, 120000)
