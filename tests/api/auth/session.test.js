require('should')
const { getUser, getUserB, shouldNotBeCalled } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { buildSessionCookies, parseSessionCookies, buildBase64EncodedJson, parseBase64EncodedJson } = require('../utils/auth')

describe('auth:session', () => {
  it('should give access to restricted resources', async () => {
    const user = await getUser()
    const [ sessionCookie, signatureCookie ] = parseSessionCookies(user.cookie)
    const cookie = buildSessionCookies(sessionCookie, signatureCookie)
    const { statusCode } = await getRestrictedResource(cookie)
    statusCode.should.equal(200)
  })

  it('should include the passport object with the current user id', async () => {
    const user = await getUser()
    const [ sessionCookie ] = parseSessionCookies(user.cookie)
    const { passport } = parseBase64EncodedJson(sessionCookie)
    passport.should.deepEqual({ user: user._id })
  })

  it('should reject a session with a tampered user', async () => {
    const [ userA, userB ] = await Promise.all([ getUser(), getUserB() ])
    const [ sessionCookie, signatureCookie ] = parseSessionCookies(userA.cookie)
    const sessionCookieData = parseBase64EncodedJson(sessionCookie)
    // Checking that buildBase64EncodedJson would produce the same cookie if passed the same data
    buildBase64EncodedJson(sessionCookieData).should.equal(sessionCookie)
    sessionCookieData.passport.user = userB._id
    const tamperedSessionCookie = buildBase64EncodedJson(sessionCookieData)
    const tamperedCookies = buildSessionCookies(tamperedSessionCookie, signatureCookie)
    await getRestrictedResource(tamperedCookies)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should include a session initialization timestamp', async () => {
    const user = await getUser()
    const [ sessionCookie ] = parseSessionCookies(user.cookie)
    const { timestamp } = parseBase64EncodedJson(sessionCookie)
    timestamp.should.be.a.Number()
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    timestamp.should.be.above(fiveMinutesAgo)
    timestamp.should.be.belowOrEqual(now)
  })

  it('should reject a session with a tampered timestamp', async () => {
    const user = await getUser()
    const [ sessionCookie, signatureCookie ] = parseSessionCookies(user.cookie)
    const sessionCookieData = parseBase64EncodedJson(sessionCookie)
    // Checking that buildBase64EncodedJson would produce the same cookie if passed the same data
    buildBase64EncodedJson(sessionCookieData).should.equal(sessionCookie)
    sessionCookieData.timestamp = sessionCookieData.timestamp - 1
    const tamperedSessionCookie = buildBase64EncodedJson(sessionCookieData)
    const tamperedCookies = buildSessionCookies(tamperedSessionCookie, signatureCookie)
    await getRestrictedResource(tamperedCookies)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should reject a session with a tampered signature', async () => {
    const user = await getUser()
    const [ sessionCookie, signatureCookie ] = parseSessionCookies(user.cookie)
    const tamperedSignatureCookie = signatureCookie.replace(/\d/, 'Z')
    const tamperedCookies = buildSessionCookies(sessionCookie, tamperedSignatureCookie)
    await getRestrictedResource(tamperedCookies)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })
})

const getRestrictedResource = cookie => rawRequest('get', '/api/user', { headers: { cookie } })
