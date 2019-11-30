require('should')
const { authReq, undesiredErr } = require('../utils/utils')
const { generateIsbn13, randomLabel } = require('../fixtures/entities')
const endpoint = '/api/entities?action=exists-or-create-from-seed'

describe('entities:exists-or-create-from-seed', () => {
  it('should reject without isbn', done => {
    authReq('post', endpoint)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without title', done => {
    authReq('post', endpoint, { isbn: generateIsbn13() })
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject if isbn is invalid', done => {
    authReq('post', endpoint, {
      isbn: '000000',
      title: randomLabel()
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid isbn')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject if authors is not a string', done => {
    authReq('post', endpoint, {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: 1
    })
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid authors')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should create an edition', done => {
    authReq('post', endpoint, {
      isbn: generateIsbn13(),
      title: randomLabel()
    })
    .then(res => {
      res._id.should.be.a.String()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should create an edition and a work from seed', done => {
    authReq('post', endpoint, {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: [ randomLabel() ]
    })
    .then(res => {
      res._id.should.be.a.String()
      const workUri = res.claims['wdt:P629'][0]
      authReq('get', `/api/entities?action=by-uris&uris=${workUri}`)
      .get('entities')
      .then(entities => {
        entities[workUri].should.be.an.Object()
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})
