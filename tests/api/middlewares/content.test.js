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
// Using the request lib to have total control on the generated request content type
const request = require('request')
const host = CONFIG.fullHost()

describe('content', () => describe('body-parser', () => {
  it('should accept JSON with application/json content-type', done => makeRequest('application/json', done))

  it('should accept JSON with application/application/csp-report content-type', done => makeRequest('application/csp-report', done))

  it('should accept JSON with application/x-www-form-urlencoded content-type', done => makeRequest('application/x-www-form-urlencoded', done))

  it('should reject url encoded bodies', (done) => {
    const params = {
      method: 'POST',
      url: `${host}/api/tests`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'bla=123'
    }

    return request(params, (err, res) => {
      res.statusCode.should.equal(400)
      JSON.parse(res.body).status_verbose.should.equal('invalid JSON body')
      return done()
    })
  })

  return it('should make an exception for /api/submit', (done) => {
    const params = {
      method: 'POST',
      url: `${host}/api/submit?redirect=foo`,
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'bla=123'
    }

    return request(params, (err, res) => {
      res.statusCode.should.equal(302)
      res.headers.location.should.equal('/foo')
      return done()
    })
  })
}))

var makeRequest = function(contentType, done){
  const params = {
    method: 'POST',
    url: `${host}/api/tests`,
    headers: {
      'content-type': contentType
    },
    body: JSON.stringify({ bla: 123 })
  }

  return request(params, (err, res) => {
    if (err) { return done(err)
    } else {
      res.statusCode.should.equal(200)
      JSON.parse(res.body).body.bla.should.equal(123)
      return done()
    }
  })
}
