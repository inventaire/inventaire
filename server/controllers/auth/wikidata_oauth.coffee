CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
root = CONFIG.fullPublicHost()
{ consumerKey, consumerSecret } = CONFIG.wikidataOAuth
qs = require 'querystring'
user_ = __.require 'controllers', 'user/lib/user'

# Alternatively using the nice or the non-nice URL
# see https://mediawiki.org/wiki/OAuth/For_Developers#Notes
wdHost = 'https://www.wikidata.org'
wdBaseNice = "#{wdHost}/wiki/"
wdBaseNonNice = "#{wdHost}/w/index.php?title="
step1Url = "#{wdBaseNonNice}Special:OAuth/initiate"
step2Url = "#{wdBaseNice}Special:OAuth/authorize"
step3Url = "#{wdBaseNonNice}Special:OAuth/token"
reqTokenSecrets = {}

module.exports = (req, res)->
  { _id:reqUserId } = req.user
  { oauth_verifier:verifier, oauth_token:reqToken } = req.query

  step1 = not (verifier? and reqToken?)

  if step1
    getStep1Token()
    .then (step1Res)->
      { oauth_token_secret:reqTokenSecret } = qs.parse step1Res
      reqTokenSecrets[reqUserId] = reqTokenSecret
      res.redirect "#{step2Url}?#{step1Res}"
    .catch error_.Handler(req, res)
  else
    getStep3 reqUserId, verifier, reqToken
    .then saveUserTokens(reqUserId)
    .then _.Ok(res)
    .catch error_.Handler(req, res)

getStep1Token = ->
  promises_.post
    url: step1Url
    oauth:
      callback: "#{root}/api/auth?action=wikidata-oauth"
      consumer_key: consumerKey
      consumer_secret: consumerSecret

getStep3 = (reqUserId, verifier, oauthToken)->
  reqTokenSecret = reqTokenSecrets[reqUserId]
  promises_.post
    url: step3Url
    oauth:
      consumer_key: consumerKey
      consumer_secret: consumerSecret
      token: oauthToken
      token_secret: reqTokenSecret
      verifier: verifier
  .finally -> delete reqTokenSecrets[reqUserId]

saveUserTokens = (reqUserId)-> (step3Res)->
  { oauth_token_secret:userTokenSecret, oauth_token:userToken } = qs.parse step3Res
  data = { key: userToken, secret: userTokenSecret }
  user_.setOauthTokens reqUserId, 'wikidata', data
