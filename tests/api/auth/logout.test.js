import CONFIG from 'config'
import 'should'
import { getUser, shouldNotBeCalled } from '../utils/utils'
import { rawRequest } from '../utils/request'
import { parseSessionCookies, parseBase64EncodedJson } from '../utils/auth'
const origin = CONFIG.getLocalOrigin()
const endpoint = `${origin}/api/auth?action=logout`
const authentifiedEndpoint = `${origin}/api/user`

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
