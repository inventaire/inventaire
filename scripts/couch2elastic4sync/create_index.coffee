CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
{ host } = CONFIG.elasticsearch

module.exports = (dbName)->
  url = "#{host}/#{dbName}"
  requests_.put url
  .then _.Log("created: #{url}")
  .catch ignoreAlreadyExisting(url)

ignoreAlreadyExisting = (url)-> (err)->
  if err.body?.error.type is 'index_already_exists_exception'
    _.warn url, 'database already exist'
  else
    throw err
