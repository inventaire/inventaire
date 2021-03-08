const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
require('should')
const { publicReq, undesiredRes } = require('../utils/utils')

const buildUrl = (property, value) => {
  return _.buildPath('/api/entities', { action: 'reverse-claims', property, value })
}

describe('entities:reverse-claims', () => {
  it('should reject wdt:P31 requests', done => {
    publicReq('get', buildUrl('wdt:P31', 'wd:Q571'))
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('denylisted property')
      done()
    })
    .catch(done)
  })

  it('should accept allowlisted entity value properties', done => {
    publicReq('get', buildUrl('wdt:P921', 'wd:Q456'))
    .then(res => {
      res.uris.should.be.an.Array()
      done()
    })
    .catch(done)
  })

  it('should accept allowlisted string value properties', done => {
    publicReq('get', buildUrl('wdt:P3035', '978-2-505'))
    .then(res => {
      res.uris.should.be.an.Array()
      done()
    })
    .catch(done)
  })
})
