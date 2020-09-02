require('should')
const { publicReq } = require('../utils/utils')
const endpoint = '/api/entities?action=changes'
const { merge } = require('../utils/entities')
const { createHuman } = require('../fixtures/entities')

describe('entities:changes', () => {
  it('should return an array of changes', done => {
    publicReq('get', endpoint)
    .then(res => {
      res.uris.should.be.an.Array()
      parseInt(res.lastSeq.split('-')[0]).should.be.an.Number()
      done()
    })
    .catch(done)
  })

  it('should take a since parameter', done => {
    publicReq('get', `${endpoint}&since=2`)
    .then(res => {
      res.uris.should.be.an.Array()
      parseInt(res.lastSeq.split('-')[0]).should.be.an.Number()
      done()
    })
    .catch(done)
  })

  it('should throw when passed an invalid since parameter', done => {
    publicReq('get', `${endpoint}&since=-2`)
    .catch(err => {
      err.body.error_name.should.equal('invalid_since')
      done()
    })
    .catch(done)
  })

  it('should return redirected entities', done => {
    Promise.all([ createHuman(), createHuman() ])
    .then(([ humanA, humanB ]) => {
      return merge(humanA.uri, humanB.uri)
      .then(() => publicReq('get', endpoint))
      .then(res => {
        res.uris.should.containEql(humanA.uri)
        res.uris.should.containEql(humanB.uri)
        done()
      })
    })
    .catch(done)
  })
})
