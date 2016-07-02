__ = require('config').universalPath
_ = __.require 'builders', 'utils'
url = require 'url'
request = require 'request'
error_ = __.require 'lib', 'error/error'

{ Ip } = __.require 'models', 'tests/regex'
isIp = Ip.test.bind Ip
validProtocols = [ 'http:', 'https:' ]

module.exports = (req, res)->
  # removing both /api/proxy/public/ and https://inventaire.io/api/proxy/public/
  queriedUrl = req.originalUrl.split('/api/proxy/public/')[1]
  { protocol, hostname } = url.parse queriedUrl
  { method } = req
  methodIsPost = method is 'POST'

  # in case the protocol is missing
  # the url parser still returns a defined protocol
  #   ex: url.parse('192.168.0.1:1234')
  #   => protocal = 192.168.0.1, hostname = 1234
  # thus the need to check it really is a valid protocol
  unless protocol in validProtocols
    return error_.bundle req, res, 'invalid protocol', 400, queriedUrl

  unless validHostname hostname, methodIsPost
    return error_.bundle req, res, 'invalid hostname', 400, queriedUrl

  options =
    method: method
    url: queriedUrl
    headers:
      # spoofing a User Agent to avoid possible User-Agent-based 403 answers
      # (happens especially for images)
      'User-Agent': "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:42.0) Gecko/20100101 Firefox/42.0"

  if methodIsPost
    options.body = JSON.stringify req.body
    _.log options.body, 'body'

  request options
  .on 'error', ErrorHandler(req, res)
  .pipe res

# can't just make a whitelist as images from anywhere
# are queried through this process
validHostname = (hostname, methodIsPost)->
  unless hostname? then return false

  if methodIsPost
    unless hostname in postWightlist then return false

  # prevent access to resources behind the firewall
  if hostname is 'localhost' then return false
  # conservative rule to make sure the above
  # no-behind-firewall-snuffing restriction is respected
  if isIp hostname then return false
  return true

# assuming a request error is on the client's fault => 400
ErrorHandler = (req, res)-> (err)-> error_.handler req, res, err, 400

postWightlist = [
  'data.inventaire.io'
]
