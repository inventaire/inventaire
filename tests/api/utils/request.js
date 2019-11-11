// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const host = CONFIG.fullHost()
const breq = require('bluereq')

var testServerAvailability = () => breq.get(`${host}/api/tests`)
.then(res => _.success('tests server is ready'))
.timeout(1000)
.catch((err) => {
  if ((err.code !== 'ECONNREFUSED') && (err.name !== 'TimeoutError')) throw err
  _.log('waiting for tests server', null, 'grey')
  return Promise.resolve()
  .delay(500)
  .then(testServerAvailability)
})

const waitForTestServer = testServerAvailability()

const rawRequest = (method, breqParams) => waitForTestServer
.then(() => breq[method](breqParams))

const request = function(method, endpoint, body, cookie){
  const data = {
    url: host + endpoint,
    headers: { cookie }
  }

  if (body != null) { data.body = body }

  return waitForTestServer
  .then(() => breq[method](data).get('body'))
}
// .catch _.ErrorRethrow("#{method} #{endpoint} #{JSON.stringify(body)} err")

const customAuthReq = (userPromise, method, endpoint, body) => userPromise
// gets a user doc to which tests/api/fixtures/users added a cookie attribute
.then(user => request(method, endpoint, body, user.cookie))

module.exports = { request, rawRequest, customAuthReq }
