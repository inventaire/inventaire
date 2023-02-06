import crypto from 'node:crypto'
import CONFIG from 'config'
import OAuth from 'oauth-1.0a'
import { setUserOauthTokens } from '#controllers/user/lib/user'
import { requests_ } from '#lib/requests'
import { parseQuery } from '#lib/utils/url'

const root = CONFIG.getPublicOrigin()
const createHmacSha1Hash = (baseString, key) => {
  return crypto.createHmac('sha1', key)
  .update(baseString)
  .digest('base64')
}

const { consumer_key: consumerKey, consumer_secret: consumerSecret } = CONFIG.wikidataOAuth
// Documentation: https://github.com/ddo/oauth-1.0a#readme
const oauth = OAuth({
  consumer: {
    key: consumerKey,
    secret: consumerSecret,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: createHmacSha1Hash,
})

// Alternatively using the nice or the non-nice URL
// see https://mediawiki.org/wiki/OAuth/For_Developers#Notes
const wdHost = 'https://www.wikidata.org'
const wdBaseNice = `${wdHost}/wiki/`
const wdBaseNonNice = `${wdHost}/w/index.php?title=`
const step1Url = `${wdBaseNonNice}Special:OAuth/initiate`
const step2Url = `${wdBaseNice}Special:OAuth/authorize`
const step3Url = `${wdBaseNonNice}Special:OAuth/token`
const reqTokenSecrets = {}

export default async (req, res) => {
  const { _id: reqUserId } = req.user
  const { oauth_verifier: verifier, oauth_token: reqToken, redirect } = req.query

  const step1 = !(verifier || reqToken)

  if (step1) {
    const step1Res = await getStep1Token(redirect)
    const { oauth_token_secret: reqTokenSecret } = parseQuery(step1Res)
    reqTokenSecrets[reqUserId] = reqTokenSecret
    res.redirect(`${step2Url}?${step1Res}`)
  } else {
    const step3Res = await getStep3(reqUserId, verifier, reqToken)
    await saveUserTokens(step3Res, reqUserId)
    res.redirect(`${root}${redirect}`)
  }
}

const getStep1Token = redirect => {
  let callback = `${root}/api/auth?action=wikidata-oauth`
  if (redirect && redirect[0] === '/') callback += `&redirect=${redirect}`
  const reqData = {
    url: step1Url,
    data: {
      oauth_callback: callback,
    },
  }
  const headers = getOauthHeaders(reqData)
  return requests_.post(step1Url, { headers, parseJson: false })
}

const getStep3 = (reqUserId, verifier, reqToken) => {
  const reqTokenSecret = reqTokenSecrets[reqUserId]
  const reqData = {
    url: step3Url,
    data: {
      oauth_verifier: verifier,
    },
  }
  const headers = getOauthHeaders(reqData, { key: reqToken, secret: reqTokenSecret })
  return requests_.post(step3Url, { headers, parseJson: false })
  .finally(() => {
    delete reqTokenSecrets[reqUserId]
  })
}

const getOauthHeaders = (reqData, tokenData) => {
  reqData.method = 'POST'
  const signature = oauth.authorize(reqData, tokenData)
  return oauth.toHeader(signature)
}

const saveUserTokens = (step3Res, reqUserId) => {
  const { oauth_token_secret: userTokenSecret, oauth_token: userToken } = parseQuery(step3Res)
  const data = { token: userToken, token_secret: userTokenSecret }
  return setUserOauthTokens(reqUserId, 'wikidata', data)
}
