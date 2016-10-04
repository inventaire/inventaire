__ = require('config').universalPath
_ = __.require('builders', 'utils')

promises_ = require './promises'
wdk = require 'wikidata-sdk'
wd = __.require('sharedLibs', 'wikidata')(promises_, _, wdk)
wd.sitelinks = __.require 'sharedLibs','wiki_sitelinks'
{ Q } = __.require 'sharedLibs','wikidata_aliases'
{ base } = wd.API.wikidata
qs = require 'querystring'

searchEntities = (search)->
  search = qs.escape search
  url = wd.API.wikidata.search search
  _.log url, 'searchEntities'
  return promises_.get url

filterAndBrush = (res)->
  _.values res.entities
  .filter filterWhitelisted

missPrefixes = true
filterWhitelisted = (entity)->
  { P31 } = entity.claims
  unless P31? then return false

  simplifiedP31 = wdk.simplifyPropertyClaims P31
  switch wd.getType simplifiedP31, missPrefixes
    when 'book', 'human' then return true
    else return false

resolveWikiUrl = (url)->
  _.log url, 'resolveWikiUrl'
  lang = url.replace /.*\/\/([a-z]{2,3})\..*/, '$1'
  title = url.split('/').last()
  resolveWikiTitle title, lang

resolveWikiTitle = (title, lang='en')->
  url = "#{base}?action=wbgetentities&sites=#{lang}wiki&format=json&props=info&titles=#{title}"
  promises_.get url
  .get 'entities'
  .then _.values
  .then _.Log('values')
  .map _.property('id')
  .then _.Log('ids')
  .then (ids)->
    if ids.length isnt 1 then throw new Error 'id not found'
    return ids[0]
  .then _.Log('ids?')
  .catch _.ErrorRethrow('resolveWikiTitle err')

# expect URIs to look like https://wikidata.org/entity/Q184226
getQidFromUri = (uri)-> uri.split('/').last()

# Only extending with wdk.helpers instead of every wdk functions
# in order to avoid overwritting local functions.
# That said, ideally, local functions should be renamed
# to avoid collisions with wdk functions
module.exports = _.extend wd, wdk.helpers,
  searchEntities: searchEntities
  filterAndBrush: filterAndBrush
  resolveWikiUrl: resolveWikiUrl
  getQidFromUri: getQidFromUri
