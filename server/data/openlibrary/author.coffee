__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
cache_ = __.require 'lib', 'cache'
{ resolveWikiUrl } = __.require 'lib', 'wikidata'
{ base } = require './api'
{ stringObject, wikidataObject } = require '../wrappers'
{ oneYear } =  __.require 'lib', 'times'


module.exports = (olAuthorKey)->
  unless validAuthorKey olAuthorKey
    _.warn olAuthorKey, 'invalid author key'
    return promises_.reject new Error 'invalid author key'

  key = "ol:#{olAuthorKey}"
  cache_.get key, requestOpenLibraryData.bind(null, olAuthorKey), oneYear

requestOpenLibraryData = (olAuthorKey)->
  promises_.get "#{base}#{olAuthorKey}"
  .then _.Log('authors data')
  .then parseResult
  .catch _.ErrorRethrow('requestOpenLibraryData err')

wpLink = { title: 'Wikipedia entry' }

parseResult = (res)->
  { name, links } = res
  wpUrl = _.findWhere(links, wpLink)?.url

  unless wpUrl? then return resolveToName name

  getWikidataId wpUrl, name
  .catch (err)->
    _.error err, 'getWikidataId err'
    return resolveToName name


getWikidataId = (wpUrl, name)->
  resolveWikiUrl wpUrl
  .then (wikidataId)-> wikidataObject wikidataId, name

resolveToName = (name)->
  promises_.resolve stringObject(name)

validAuthorKey = (key)-> /^\/authors\/OL\w+$/.test key
