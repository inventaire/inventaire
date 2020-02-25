const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { wait } = __.require('lib', 'promises')
const host = CONFIG.fullPublicHost()
const breq = require('bluereq')
const assert_ = __.require('utils', 'assert_types')

const testServerAvailability = () => {
  return breq.get(`${host}/api/tests`)
  .then(() => _.success('tests server is ready'))
  .timeout(1000)
  .catch(err => {
    if ((err.code !== 'ECONNREFUSED') && (err.name !== 'TimeoutError')) throw err
    _.log('waiting for tests server', null, 'grey')

    return wait(500)
    .then(testServerAvailability)
  })
}

const waitForTestServer = testServerAvailability()

const rawRequest = (method, breqParams) => {
  assert_.string(method)
  return waitForTestServer
  .then(() => breq[method](breqParams))
}

const request = (method, endpoint, body, cookie) => {
  assert_.string(method)
  assert_.string(endpoint)
  const data = {
    url: host + endpoint,
    headers: { cookie }
  }

  if (body != null) data.body = body

  return waitForTestServer
  .then(() => breq[method](data).then(({ body }) => body))
}

const customAuthReq = async (userPromise, method, endpoint, body) => {
  assert_.object(userPromise)
  assert_.string(method)
  assert_.string(endpoint)
  // Also accept already resolved user docs with their cookie
  if (userPromise._id && userPromise.cookie) userPromise = Promise.resolve(userPromise)
  const user = await userPromise
  // Gets a user doc to which tests/api/fixtures/users added a cookie attribute
  return request(method, endpoint, body, user.cookie)
}

module.exports = { request, rawRequest, customAuthReq }
