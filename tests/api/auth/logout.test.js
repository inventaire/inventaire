require('should')
const CONFIG = require('config')
const host = CONFIG.fullHost()
const { getUser, undesiredRes } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const endpoint = `${host}/api/auth?action=logout`
const authentifiedEndpoint = `${host}/api/user`
const sessionCookieName = `${CONFIG.name}:session`
const sessionSignatureCookieName = `${sessionCookieName}.sig`

describe('auth:logout', () => {
  it('should logout and unable to access an authentified endpoint', done => {
    getUser()
    .then(user => {
      const { [sessionCookieName]: sessionCookie, [sessionSignatureCookieName]: signatureCookie } = getSessionCookies(user.cookie)
      parseEncodedJson(sessionCookie).passport.user.should.equal(user._id)
      parseEncodedJson(sessionCookie).timestamp.should.be.a.Number()
      return rawRequest('post', endpoint, {
        headers: {
          cookie: user.cookie
        }
      })
      .then(res => {
        const {
          [sessionCookieName]: sessionCookieAfterLogout,
          [sessionSignatureCookieName]: signatureCookieAfterLogout
        } = getSessionCookies(res.headers['set-cookie'])
        parseEncodedJson(sessionCookieAfterLogout).passport.should.deepEqual({})
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

const sessionCookiePattern = new RegExp(`${sessionCookieName}=([\\w/=+]+)`)
const sessionSignatureCookiePattern = new RegExp(`${sessionCookieName}\\.sig=([\\w/=+]+)`)

const getSessionCookies = cookieStr => {
  const sessionCookieMatch = cookieStr.match(sessionCookiePattern)
  const sessionSignatureCookieMatch = cookieStr.match(sessionSignatureCookiePattern)
  return {
    [sessionCookieName]: sessionCookieMatch[1],
    [sessionSignatureCookieName]: sessionSignatureCookieMatch[1],
  }
}

const parseEncodedJson = base64Str => JSON.parse(Buffer.from(base64Str, 'base64').toString())
