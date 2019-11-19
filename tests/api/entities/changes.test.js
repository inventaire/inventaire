// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('should')
const { nonAuthReq, undesiredErr } = require('../utils/utils')

describe('entities:changes', () => {
  it('should returns an array of changes', done => {
    nonAuthReq('get', '/api/entities?action=changes')
    .then(res => {
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should take a since parameter', done => {
    nonAuthReq('get', '/api/entities?action=changes&since=2')
    .then(res => {
      res.uris.should.be.an.Array()
      res.lastSeq.should.be.an.Number()
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should throw when passed an invalid since parameter', done => {
    nonAuthReq('get', '/api/entities?action=changes&since=-2')
    .catch(err => {
      err.body.error_name.should.equal('invalid_since')
      done()
    })
    .catch(undesiredErr(done))
  })
})
