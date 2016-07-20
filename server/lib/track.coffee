# Doc: http://developer.piwik.org/api-reference/tracking-api
CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ enabled, endpoint, idsite, rec } = CONFIG.piwik
host = CONFIG.fullHost()
placeholderUrl = '/unknown'
promises_ = require './promises'

track = (req, actionArray)->
  unless enabled then return

  { _id:userId, language } = req.user
  { referer:url, 'user-agent':ua, 'accept-language':al } = req.headers
  [ category, action, name, value ] = actionArray

  # a url is required so we use a placeholder if not provided in parameter
  url or= placeholderUrl
  # allow to pass a relative path to let this module turn it into the expected full url
  if url[0] is '/' then url = "#{host}#{url}"

  data =
    idsite: idsite
    rec: rec
    url: url
    uid: userId
    e_c: category
    # prefixing the action with the category
    # as Piwik don't allow multicriteria Objectifs such as
    # Category is a and Action is b
    e_a: "#{category}:#{action}"
    e_n: name
    e_v: value
    ua: encodeURIComponent ua
    lang: language or encodeURIComponent al

  promises_.get _.buildPath(endpoint, data)
  .catch _.Error('track error')

  # do not return the promise as a failing track request should make the rest
  # of operations fail
  return

module.exports =
  track: track
  Track: (args...)-> ()-> track.apply null, args
