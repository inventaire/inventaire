# Doc: http://developer.piwik.org/api-reference/tracking-api
CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ enabled, endpoint, idsite, rec } = CONFIG.piwik
host = CONFIG.fullHost()
placeholderUrl = '/unknown'
promises_ = require './promises'

track = (userId, url, category, action, name, value)->
  unless enabled then return

  # Polymorphism: allow to pass the options as 1:the req object, 2: the action array
  # It's convenient when the user is authentificated and the req object thus has already
  # all what we need
  if _.typeOf(userId) is 'object' and _.typeOf(url) is 'array'
    req = userId
    actionArray = url

    userId = req.user._id
    url = req.headers.referer
    [ category, action, name, value ] = actionArray


  # a url is required so we use a placeholder if not provided in parameter
  url or= placeholderUrl
  # allow to pass a relative path to let this module turn it into the expected full url
  if url[0] is '/' then url = "#{host}#{url}"

  args = [userId, url, category, action, name, value]
  _.log args, 'track args'

  queryUrl = _.buildPath endpoint,
    idsite: idsite
    rec: rec
    url: url
    uid: userId
    e_c: category
    e_a: action
    e_n: name
    e_v: value

  promises_.get queryUrl
  .catch _.Error('track error')

  # do not return the promise as a failing track request should make the rest
  # of operations fail
  return

module.exports =
  track: track
  Track: (args...)-> ()-> track.apply null, args
