const CONFIG = require('config')
require('should')
const host = CONFIG.fullHost()
const { getUser, shouldNotBeCalled } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const endpoint = `${host}/api/auth?action=logout`
const authentifiedEndpoint = `${host}/api/user`
const { parseSessionCookies, parseBase64EncodedJson } = require('../utils/auth')

describe('auth:logout', () => {
  it('should logout and unable to access an authentified endpoint', async () => {
    const user = await getUser()
    const [ sessionCookie, signatureCookie ] = parseSessionCookies(user.cookie)
    parseBase64EncodedJson(sessionCookie).passport.user.should.equal(user._id)
    const { headers } = await rawRequest('post', endpoint, {
      headers: {
        cookie: user.cookie
      }
    })
    const [ sessionCookieAfterLogout, signatureCookieAfterLogout ] = parseSessionCookies(headers['set-cookie'])
    parseBase64EncodedJson(sessionCookieAfterLogout).passport.should.deepEqual({})
    signatureCookieAfterLogout.should.not.equal(signatureCookie)
    await rawRequest('get', authentifiedEndpoint, {
      headers: {
        cookie: headers['set-cookie']
      }
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })
})
