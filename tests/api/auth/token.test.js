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
const { nonAuthReq, undesiredRes, getUser } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { rawRequest } = require('../utils/request')
const host = CONFIG.fullHost()

describe('token:reset-password', () => it('should reject requests without email', (done) => {
  nonAuthReq('get', '/api/token?action=reset-password')
  .then(undesiredRes(done))
  .catch((err) => {
    err.body.status_verbose.should.equal('missing parameter in query: email')
    return done()}).catch(done)

}))

describe('token:validation-email', () => it('should reject requests without email', (done) => {
  rawRequest('get', {
    url: `${host}/api/token?action=validation-email`,
    followRedirect: false
  }).then((res) => {
    res.headers.location.should.equal('/?validEmail=false')
    return done()}).catch(done)

}))
