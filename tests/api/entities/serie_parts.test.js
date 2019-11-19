// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')
const { createWorkWithAuthorAndSerie } = require('../fixtures/entities')
const workWithSeriePromise = createWorkWithAuthorAndSerie()

describe('entities:author-works', () => it('should get an authors works', done => {
  workWithSeriePromise
  .then(work => {
    const serieUri = work.claims['wdt:P179'][0]
    return nonAuthReq('get', `/api/entities?action=serie-parts&uri=${serieUri}`)
    .then(res => {
      res.parts.should.be.an.Array()
      res.parts[0].should.be.an.Object()
      res.parts[0].uri.should.equal(`inv:${work._id}`)
      done()
    })
  })
  .catch(undesiredErr(done))
}))
