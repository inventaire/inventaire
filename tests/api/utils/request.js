const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { wait } = __.require('lib', 'promises')
const host = CONFIG.fullPublicHost()
const requests_ = __.require('lib', 'requests')
const assert_ = __.require('utils', 'assert_types')

const testServerAvailability = async () => {
  try {
    await requests_.get(`${host}/api/tests`, { timeout: 1000 })
    _.success('tests server is ready')
  } catch (err) {
    if (err.code !== 'ECONNREFUSED' && err.name !== 'TimeoutError') throw err
    _.log('waiting for tests server', null, 'grey')
    await wait(500)
    return testServerAvailability()
  }
}

const waitForTestServer = testServerAvailability()

const rawRequest = async (method, url, reqParams = {}) => {
  assert_.string(method)
  await waitForTestServer
  reqParams.returnBodyOnly = false
  reqParams.redirect = 'manual'
  reqParams.parseJson = false
  if (url[0] === '/') url = `${host}${url}`
  return requests_[method](url, reqParams)
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
  try {
    return requests_[method](url, data)
  } catch (err) {
    if (err.message === 'request error' && err.body && err.body.status_verbose) {
      err.message = `${err.message}: ${err.body.status_verbose}`
    }
    throw err
  }
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
