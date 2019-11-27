require('should')
const { nonAuthReq, undesiredErr, undesiredRes } = require('../utils/utils')
const { createWorkWithAuthorAndSerie } = require('../fixtures/entities')
const workWithSeriePromise = createWorkWithAuthorAndSerie()
const endpoint = '/api/entities?action=serie-parts'

describe('entities:serie-parts', () => {
  it('should reject without uri', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
      done()
    })
    .catch(done)
  })

  it('should get an authors works', done => {
    workWithSeriePromise
    .then(work => {
      const serieUri = work.claims['wdt:P179'][0]
      nonAuthReq('get', `${endpoint}&uri=${serieUri}`)
      .then(res => {
        res.parts.should.be.an.Array()
        res.parts[0].should.be.an.Object()
        res.parts[0].uri.should.equal(`inv:${work._id}`)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})
