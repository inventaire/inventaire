const __ = require('config').universalPath
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const endpoint = '/api/entities?action=changes'
const { merge } = require('../utils/entities')
const { createHuman } = require('../fixtures/entities')
const { Promise } = __.require('lib', 'promises')

describe('entities:changes', () => {
  it('should return an array of changes', done => {
    nonAuthReq('get', endpoint)
    .then(res => {
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should take a since parameter', done => {
    nonAuthReq('get', `${endpoint}&since=2`)
    .then(res => {
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should throw when passed an invalid since parameter', done => {
    nonAuthReq('get', `${endpoint}&since=-2`)
    .catch(err => {
      err.body.error_name.should.equal('invalid_since')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should return redirected entities', done => {
    Promise.all([ createHuman(), createHuman() ])
    .spread((humanA, humanB) => {
      merge(humanA.uri, humanB.uri)
      .then(() => {
        nonAuthReq('get', endpoint)
        .then(res => {
          res.uris.should.containEql(humanA.uri)
          res.uris.should.containEql(humanB.uri)
          done()
        })
      })
    })
    .catch(undesiredErr(done))
  })
})
