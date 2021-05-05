const CONFIG = require('config')
const _ = require('builders/utils')
const { wait } = require('lib/promises')
const host = CONFIG.fullPublicHost()
const requests_ = require('lib/requests')
const assert_ = require('lib/utils/assert_types')

const testServerAvailability = async () => {
  if (!CONFIG.waitForServer) return

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
  assert_.string(url)
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
    return await requests_[method](url, data)
  } catch (err) {
    if (err.message === 'request error' && err.body && err.body.status_verbose) {
      err.message = `${err.message}: ${err.body.status_verbose}`
    }
    throw err
  }
}

const customAuthReq = async (user, method, endpoint, body) => {
  assert_.type('object|promise', user)
  assert_.string(method)
  assert_.string(endpoint)
  user = await user
  // Gets a user doc to which tests/api/fixtures/users added a cookie attribute
  return request(method, endpoint, body, user.cookie)
}

const rawCustomAuthReq = async ({ user, method, url, options = {} }) => {
  assert_.type('object|promise', user)
  assert_.string(method)
  assert_.string(url)
  user = await user
  options.headers = options.headers || {}
  options.headers.cookie = user.cookie
  return rawRequest(method, url, options)
}

module.exports = { request, rawRequest, customAuthReq, rawCustomAuthReq }
