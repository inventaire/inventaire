
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const { createWorkWithAuthor } = require('../fixtures/entities')
const workWithAuthorPromise = createWorkWithAuthor()

describe('entities:author-works', () => it('should get an authors works', done => {
  workWithAuthorPromise
  .then(work => {
    const authorUri = work.claims['wdt:P50'][0]
    return nonAuthReq('get', `/api/entities?action=author-works&uri=${authorUri}`)
    .then(res => {
      res.series.should.be.an.Array()
      res.works.should.be.an.Array()
      res.articles.should.be.an.Array()
      res.works[0].should.be.an.Object()
      res.works[0].uri.should.equal(`inv:${work._id}`)
      done()
    })
  })
  .catch(undesiredErr(done))
}))
