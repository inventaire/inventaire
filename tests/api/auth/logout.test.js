require('should')
const CONFIG = require('config')
const host = CONFIG.fullHost()
const { getUser, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const endpoint = `${host}/api/auth?action=logout`
const authentifiedEndpoint = `${host}/api/user`

describe('auth:logout', () => {
  it('should logout and unable to access an authentified endpoint', done => {
    getUser()
    .then(user => {
      const { 'express:sess': sessionCookie, 'express:sess.sig': signatureCookie } = parseSessionCookies(user.cookie)
      parseEncodedJson(sessionCookie).should.equal(`{"passport":{"user":"${user._id}"}}`)
      return rawRequest('post', endpoint, {
        headers: {
          cookie: user.cookie
        }
      })
      .then(res => {
        const {
          'express:sess': sessionCookieAfterLogout,
          'express:sess.sig': signatureCookieAfterLogout
        } = getSessionCookies(res.headers['set-cookie'])
        parseEncodedJson(sessionCookieAfterLogout).should.equal('{"passport":{}}')
        signatureCookieAfterLogout.should.not.equal(signatureCookie)
        return rawRequest('get', authentifiedEndpoint, {
          headers: {
            cookie: res.headers['set-cookie']
          }
        })
      })
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(401)
      done()
    })
    .catch(done)
  })
})

const parseSessionCookies = cookies => {
  const cookiesArray = cookies.split(/GMT;?( httponly;)?/)
  return getSessionCookies(cookiesArray)
}

const getSessionCookies = cookiesArray => {
  return cookiesArray
  .filter(cookie => cookie && cookie.startsWith('express:sess'))
  .map(cookie => cookie.trim().split(';')[0])
  .reduce((index, cookie) => {
    const [ key, value ] = cookie.split('=')
    index[key] = value
    return index
  }, {})
}

const parseEncodedJson = base64Str => Buffer.from(base64Str, 'base64').toString()
