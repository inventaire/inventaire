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
const { nonAuthReq, authReq, undesiredErr } = require('../utils/utils')
const { generateIsbn13, humanName, randomLabel } = require('../fixtures/entities')

describe('entities:exists-or-create-from-seed', () => {
  it('should reject if params isbn is missing', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed')
    .catch((err) => {
      err.body.status_verbose.should.startWith('missing parameter')
      done()}).catch(undesiredErr(done))

  })

  it('should reject if params title is missing', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed',
      { isbn: generateIsbn13() })
    .catch((err) => {
      err.body.status_verbose.should.startWith('missing parameter')
      done()}).catch(undesiredErr(done))

  })

  it('should reject if authors is not a string', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: 1
    }).catch((err) => {
      err.body.status_verbose.should.startWith('invalid authors')
      done()}).catch(undesiredErr(done))

  })

  it('should reject if isbn is invalid', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: '000000',
      title: randomLabel()
    }).catch((err) => {
      err.body.status_verbose.should.startWith('invalid isbn')
      done()}).catch(undesiredErr(done))

  })

  it('should accept if params authors is missing', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel()
    }).then((res) => {
      res._id.should.be.a.String()
      done()}).catch(undesiredErr(done))

  })

  it('should create an edition and a work from seed', (done) => {
    authReq('post', '/api/entities?action=exists-or-create-from-seed', {
      isbn: generateIsbn13(),
      title: randomLabel(),
      authors: [ randomLabel() ]
    })
    .then((res) => {
      res._id.should.be.a.String()
      const workUri = res.claims['wdt:P629'][0]
      return authReq('get', `/api/entities?action=by-uris&uris=${workUri}`)
      .get('entities')
      .then((entities) => {
        entities[workUri].should.be.an.Object()
        done()
      })}).catch(undesiredErr(done))

  })
})
