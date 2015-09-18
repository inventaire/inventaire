__ = require('config').root
_ = __.require 'builders', 'utils'
breq = require 'bluereq'

req = (verb, url, options)->
  breq[verb] mergeOptions(url, options)
  .then getBody

# default to JSON
baseOptions =
  headers:
    accept: 'application/json'

# merge options to fit the 'request' lib interface
# which is wrapped by breq
mergeOptions = (url, options={})->
  _.extend baseOptions, options, {url: url}

getBody = _.property 'body'

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
