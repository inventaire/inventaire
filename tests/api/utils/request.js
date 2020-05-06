const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { wait } = __.require('lib', 'promises')
const host = CONFIG.fullPublicHost()
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')

const testServerAvailability = () => {
  return requests_.get(`${host}/api/tests`, { timeout: 1000 })
  .then(() => _.success('tests server is ready'))
  .catch(err => {
    if ((err.code !== 'ECONNREFUSED') && (err.name !== 'TimeoutError')) throw err
    _.log('waiting for tests server', null, 'grey')

    return wait(500)
    .then(testServerAvailability)
  })
}

const waitForTestServer = testServerAvailability()

const rawRequest = async (method, url, requestParams) => {
  assert_.string(method)
  await waitForTestServer
  requestParams.returnBodyOnly = false
  return requests_[method](url, requestParams)
}

const request = async (method, endpoint, body, cookie) => {
  assert_.string(method)
  assert_.string(endpoint)
  const url = host + endpoint
  const data = {
    headers: { cookie }
  }

  if (body != null) data.body = body

  await waitForTestServer
  return requests_[method](url, data)
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
