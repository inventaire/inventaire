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

# expect URIs to look like https://wikidata.org/entity/Q184226
getQidFromUri = (uri)-> uri.split('/').last()

formatTextFields = (data, multivalue=false)->
  for lang, obj of data
    if multivalue
      data[lang] = obj.map getValue
    else
      data[lang] = obj.value
  return data

getValue = _.property 'value'

# Only extending with wdk.helpers instead of every wdk functions
# in order to avoid overwritting local functions.
# That said, ideally, local functions should be renamed
# to avoid collisions with wdk functions
module.exports = _.extend wd, wdk.helpers,
  searchEntities: searchEntities
  filterAndBrush: filterAndBrush
  getQidFromUri: getQidFromUri
  formatTextFields: formatTextFields
