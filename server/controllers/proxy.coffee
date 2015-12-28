__ = require('config').universalPath
_ = __.require 'builders', 'utils'
url = require 'url'
request = require 'request'
error_ = __.require 'lib', 'error/error'

{ Ip } = __.require 'models', 'tests/regex'
isIp = Ip.test.bind Ip
validProtocols = [ 'http:', 'https:' ]

module.exports.get = (req, res, next)->
  # removing both /api/proxy/public/ and https://inventaire.io/api/proxy/public/
  query = req.originalUrl.split('/api/proxy/public/')[1]

  { protocol, hostname } = url.parse query

  # in case the protocol is missing
  # the url parser still returns a defined protocol
  #   ex: url.parse('192.168.0.1:1234')
  #   => protocal = 192.168.0.1, hostname = 1234
  # thus the need to check it really is a valid protocol
  unless protocol in validProtocols
    return error_.bundle res, 'invalid protocol', 400, query

  unless validHostname hostname
    return error_.bundle res, 'invalid hostname', 400, query

  request
    url: query
    headers:
      # spoofing a User Agent to avoid possible User-Agent-based 403 answers
      # (happens especially for images)
      'User-Agent': "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:42.0) Gecko/20100101 Firefox/42.0"

  .on 'error', ErrorHandler(res)
  .pipe res

# can't just make a whitelist as images from anywhere
# are queried through this process
validHostname = (hostname)->
  unless hostname? then return false
  # prevent access to resources behind the firewall
  if hostname is 'localhost' then return false
  # conservative rule to make sure the above
  # no-behind-firewall-snuffing restriction is respected
  if isIp hostname then return false
  return true

# assuming a request error is on the client's fault => 400
ErrorHandler = (res)-> (err)-> error_.handler res, err, 400
