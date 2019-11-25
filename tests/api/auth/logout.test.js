const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getUserGetter, customAuthReq } = require('../utils/utils')
const endpoint = '/api/auth?action=logout'
const authentifiedEndpoint = '/api/auth?action=wikidata-oauth'
const randomString = __.require('lib', './utils/random_string')

describe('auth:login', () => {
  it('should logout and unable to access an authentified endpoint', done => {
    const userPromise = getUserGetter(randomString(6), false)()
    userPromise
    .then(customAuthReq(userPromise, 'post', endpoint))
    .then(res => {
      return customAuthReq(userPromise, 'get', authentifiedEndpoint)
    })
    .catch(err => {
      err.code.should.equal('ECONNREFUSED')
      done()
    })
    .catch(done)
  })
})
