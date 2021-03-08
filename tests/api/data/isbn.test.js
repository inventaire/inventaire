const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { publicReq, undesiredRes } = require('../utils/utils')
const endpoint = '/api/data?action=isbn'
const randomString = require('lib/utils/random_string')
const { generateIsbn13 } = require('../fixtures/entities')

describe('data:isbn', () => {
  it('should reject requests without isbn', done => {
    publicReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: isbn')
      done()
    })
    .catch(done)
  })

  it('should reject requests with invalid isbn', done => {
    publicReq('get', `${endpoint}&isbn=${randomString(10)}`)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid isbn')
      done()
    })
    .catch(done)
  })

  it('should return isbn information', done => {
    const isbn = generateIsbn13()
    publicReq('get', `${endpoint}&isbn=${isbn}`)
    .then(res => {
      res.isValid.should.be.true()
      res.isbn13.should.equal(isbn)
      done()
    })
    .catch(done)
  })
})
