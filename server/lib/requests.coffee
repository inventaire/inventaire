__ = require('config').root
_ = __.require 'builders', 'utils'
breq = require 'bluereq'

req = (verb, url, options)->
  breq[verb] mergeOptions(url, options)
  .then getBody

# merge options to fit the 'request' lib interface
# which is wrapped by breq
mergeOptions = (url, options)->
  if options? then _.extend options, {url: url}
  else url

getBody = _.property 'body'

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
