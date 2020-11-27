const CONFIG = require('config')
const sessionCookieName = `${CONFIG.name}:session`
const sessionSignatureCookieName = `${sessionCookieName}.sig`
const sessionCookiePattern = new RegExp(`${sessionCookieName}=([^;]+);`)
const sessionSignatureCookiePattern = new RegExp(`${sessionCookieName}\\.sig=([^;]+);`)

module.exports = {
  sessionCookieName,
  sessionSignatureCookieName,

  parseSessionCookies: cookieStr => {
    const sessionCookieMatch = cookieStr.match(sessionCookiePattern)
    const sessionSignatureCookieMatch = cookieStr.match(sessionSignatureCookiePattern)
    const sessionCookie = sessionCookieMatch && sessionCookieMatch[1]
    const signatureCookie = sessionSignatureCookieMatch && sessionSignatureCookieMatch[1]
    return [ sessionCookie, signatureCookie ]
  },

  buildSessionCookies: (sessionCookie, signatureCookie) => {
    return `${sessionCookieName}=${sessionCookie}; ${sessionSignatureCookieName}=${signatureCookie};`
  },

  buildBase64EncodedJson: obj => Buffer.from(JSON.stringify(obj)).toString('base64'),

  parseBase64EncodedJson: base64Str => JSON.parse(Buffer.from(base64Str, 'base64').toString()),
}
