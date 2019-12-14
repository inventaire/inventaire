require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const { createWorkWithAuthor, createHuman } = require('../fixtures/entities')
const workWithAuthorPromise = createWorkWithAuthor()
const endpoint = '/api/entities?action=author-works'

describe('entities:author-works', () => {
  it('should reject without uri', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: uri')
      done()
    })
    .catch(done)
  })

  it('should return empty lists if no work on author', done => {
    createHuman()
    .then(author => {
      nonAuthReq('get', `${endpoint}&uri=${author.uri}`)
      .then(res => {
        res.series.should.be.an.Array()
        res.works.should.be.an.Array()
        res.articles.should.be.an.Array()
        done()
      })
    })
    .catch(done)
  })

  it('should get an authors works', done => {
    workWithAuthorPromise
    .then(work => {
      const authorUri = work.claims['wdt:P50'][0]
      nonAuthReq('get', `${endpoint}&uri=${authorUri}`)
      .then(res => {
        res.works[0].should.be.an.Object()
        res.works[0].uri.should.equal(`inv:${work._id}`)
        done()
      })
    })
    .catch(done)
  })
})
