require('should')
const { authReq, undesiredErr, undesiredRes } = require('../utils/utils')
const endpoint = '/api/entities?action=move-to-wikidata'
const { createWork } = require('../fixtures/entities')

describe('entities:move-to-wikidata', () => {
  it('should reject without uri', done => {
    authReq('put', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: uri')
      done()
    })
    .catch(done)
  })

  it('should reject if entity does not exist', done => {
    const uri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    authReq('put', endpoint, { uri })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('entity not found')
      err.statusCode.should.equal(400)
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should reject without oauth tokens', done => {
    // as test environment should not have any tokens
    createWork()
    .then(work => {
      authReq('put', endpoint, { uri: work.uri })
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal('missing wikidata oauth tokens')
        err.statusCode.should.equal(400)
        done()
      })
    .catch(undesiredErr(done))
    })
  })
})
