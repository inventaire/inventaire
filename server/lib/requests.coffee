__ = require('config').universalPath
_ = __.require 'builders', 'utils'
breq = require 'bluereq'

req = (verb, url, options)->
  breq[verb] mergeOptions(url, options)
  .then _.property('body')

head = (url, options)->
  breq.head mergeOptions(url, options)
  .then _.property('headers')

# default to JSON
baseOptions =
  headers:
    accept: 'application/json'

# merge options to fit the 'request' lib interface
# which is wrapped by bluereq
mergeOptions = (url, options={})->
  # accept to get the url in the options
  if _.isObject url
    options = url
    url = null

  # if the url was in the options
  # the url object will be overriden
  _.extend {url: url}, baseOptions, options,

module.exports =
  get: _.partial req, 'get'
  post: _.partial req, 'post'
  head: head
