CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
root = CONFIG.fullPublicHost()
{ consumer_key, consumer_secret } = CONFIG.wikidataOAuth
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
  { oauth_verifier:verifier, oauth_token:reqToken, redirect } = req.query

  step1 = not (verifier? and reqToken?)

  if step1
    getStep1Token redirect
    .then (step1Res)->
      { oauth_token_secret:reqTokenSecret } = qs.parse step1Res
      reqTokenSecrets[reqUserId] = reqTokenSecret
      res.redirect "#{step2Url}?#{step1Res}"
    .catch error_.Handler(req, res)
  else
    getStep3 reqUserId, verifier, reqToken
    .then saveUserTokens(reqUserId)
    .then -> res.redirect "#{root}#{redirect}"
    .catch error_.Handler(req, res)

getStep1Token = (redirect)->
  promises_.post
    url: step1Url
    oauth:
      callback: "#{root}/api/auth?action=wikidata-oauth&redirect=#{redirect}"
      consumer_key: consumer_key
      consumer_secret: consumer_secret

getStep3 = (reqUserId, verifier, oauthToken)->
  reqTokenSecret = reqTokenSecrets[reqUserId]
  promises_.post
    url: step3Url
    oauth:
      consumer_key: consumer_key
      consumer_secret: consumer_secret
      token: oauthToken
      token_secret: reqTokenSecret
      verifier: verifier
  .finally -> delete reqTokenSecrets[reqUserId]

saveUserTokens = (reqUserId)-> (step3Res)->
  { oauth_token_secret:userTokenSecret, oauth_token:userToken } = qs.parse step3Res
  data = { token: userToken, token_secret: userTokenSecret }
  user_.setOauthTokens reqUserId, 'wikidata', data
