const CONFIG = require('config')
const __ = CONFIG.universalPath
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')
const root = CONFIG.fullPublicHost()
const OAuth = require('oauth-1.0a')
const crypto = require('crypto')
const createHmacSha1Hash = (baseString, key) => {
  return crypto.createHmac('sha1', key)
  .update(baseString)
  .digest('base64')
}

// eslint-disable-next-line camelcase
const { consumer_key, consumer_secret } = CONFIG.wikidataOAuth
// Documentation: https://github.com/ddo/oauth-1.0a#readme
const oauth = OAuth({
  consumer: {
    key: consumer_key,
    secret: consumer_secret
  },
  signature_method: 'HMAC-SHA1',
  hash_function: createHmacSha1Hash
})

const qs = require('querystring')
const user_ = __.require('controllers', 'user/lib/user')

// Alternatively using the nice or the non-nice URL
// see https://mediawiki.org/wiki/OAuth/For_Developers#Notes
const wdHost = 'https://www.wikidata.org'
const wdBaseNice = `${wdHost}/wiki/`
const wdBaseNonNice = `${wdHost}/w/index.php?title=`
const step1Url = `${wdBaseNonNice}Special:OAuth/initiate`
const step2Url = `${wdBaseNice}Special:OAuth/authorize`
const step3Url = `${wdBaseNonNice}Special:OAuth/token`
const reqTokenSecrets = {}

module.exports = (req, res) => {
  const { _id: reqUserId } = req.user
  const { oauth_verifier: verifier, oauth_token: reqToken, redirect } = req.query

  const step1 = !(verifier || reqToken)

  if (step1) {
    getStep1Token(redirect)
    .then(step1Res => {
      const { oauth_token_secret: reqTokenSecret } = qs.parse(step1Res)
      reqTokenSecrets[reqUserId] = reqTokenSecret
      res.redirect(`${step2Url}?${step1Res}`)
    })
    .catch(error_.Handler(req, res))
  } else {
    getStep3(reqUserId, verifier, reqToken)
    .then(saveUserTokens(reqUserId))
    .then(() => res.redirect(`${root}${redirect}`))
    .catch(error_.Handler(req, res))
  }
}

const getStep1Token = redirect => {
  let callback = `${root}/api/auth?action=wikidata-oauth`
  if (redirect && redirect[0] === '/') callback += `&redirect=${redirect}`
  const reqData = {
    url: step1Url,
    data: {
      oauth_callback: callback
    }
  }
  const headers = getOauthHeaders(reqData)
  return requests_.post(step1Url, { headers })
}

const getStep3 = (reqUserId, verifier, reqToken) => {
  const reqTokenSecret = reqTokenSecrets[reqUserId]
  const reqData = {
    url: step3Url,
    data: {
      oauth_verifier: verifier
    }
  }
  const headers = getOauthHeaders(reqData, { key: reqToken, secret: reqTokenSecret })
  return requests_.post(step3Url, { headers })
  .finally(() => {
    delete reqTokenSecrets[reqUserId]
  })
}

const getOauthHeaders = (reqData, tokenData) => {
  reqData.method = 'POST'
  const signature = oauth.authorize(reqData, tokenData)
  const headers = oauth.toHeader(signature)
  // Prevent the response to be parsed as JSON
  headers.accept = 'text/plain'
  return headers
}

const saveUserTokens = reqUserId => step3Res => {
  const { oauth_token_secret: userTokenSecret, oauth_token: userToken } = qs.parse(step3Res)
  const data = { token: userToken, token_secret: userTokenSecret }
  return user_.setOauthTokens(reqUserId, 'wikidata', data)
}
