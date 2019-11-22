const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const host = CONFIG.fullHost()
const breq = require('bluereq')

const testServerAvailability = () => {
  return breq.get(`${host}/api/tests`)
  .then(res => _.success('tests server is ready'))
  .timeout(1000)
  .catch(err => {
    if ((err.code !== 'ECONNREFUSED') && (err.name !== 'TimeoutError')) throw err
    _.log('waiting for tests server', null, 'grey')
    return Promise.resolve()
    .delay(500)
    .then(testServerAvailability)
  })
}

const waitForTestServer = testServerAvailability()

const rawRequest = (method, breqParams) => {
  return waitForTestServer
  .then(() => breq[method](breqParams))
}

const request = (method, endpoint, body, cookie) => {
  const data = {
    url: host + endpoint,
    headers: { cookie }
  }

  if (body != null) data.body = body

  return waitForTestServer
  .then(() => breq[method](data).get('body'))
  // .catch _.ErrorRethrow("#{method} #{endpoint} #{JSON.stringify(body)} err")
}

const customAuthReq = (userPromise, method, endpoint, body) => {
  userPromise
  // Gets a user doc to which tests/api/fixtures/users added a cookie attribute
  .then(user => request(method, endpoint, body, user.cookie))
}

module.exports = { request, rawRequest, customAuthReq }
