// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { Promise } = __.require('lib', 'promises')
const { nonAuthReq, undesiredRes, undesiredErr } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const host = CONFIG.fullHost()

describe('entities:images', () => {
  it('should return an array of images associated with the passed uri', (done) => {
    nonAuthReq('get', '/api/entities?action=images&uris=wd:Q535')
    .then((res) => {
      res.images.should.be.an.Object()
      res.images['wd:Q535'].should.be.an.Array()
      res.images['wd:Q535'][0].should.be.a.String()
      done()}).catch(undesiredErr(done))

  })

  it('should reject redirect requests with multiple URIs', (done) => {
    nonAuthReq('get', '/api/entities?action=images&uris=wd:Q535|wd:Q42&redirect=true')
    .then(undesiredRes(done))
    .catch((err) => {
      err.statusCode.should.equal(400)
      done()
    })

  })

  it('should redirect to the image if requested in options', (done) => {
    const url = `${host}/api/entities?action=images&uris=wd:Q535&redirect=true&width=32`
    rawRequest('get', { url })
    .then((res) => {
      res.headers['content-type'].should.equal('image/jpeg')
      done()}).catch(undesiredErr(done))

  })
})
