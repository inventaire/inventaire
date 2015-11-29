__ = require('config').universalPath
_ = __.require('builders', 'utils')

promises_ = require './promises'
wdk = require 'wikidata-sdk'
wd = __.require('sharedLibs', 'wikidata')(promises_, _, wdk)
wd.sitelinks = __.require 'sharedLibs','wiki_sitelinks'
{ Q } = __.require 'sharedLibs','wikidata_aliases'
{ base } = wd.API.wikidata
qs = require 'querystring'

searchEntities = (search, language='en', limit='20', format='json')->
  search = qs.escape search
  url = wd.API.wikidata.search(search, language).logIt('searchEntities')
  return promises_.get url

filterAndBrush = (res)->
  results = []
  for id,entity of res.entities
    # not using wdk.simplifyClaims to let the freedom to the client
    # to use it or use all the data
    rebaseClaimsValueToClaimsRoot entity
    if filterWhitelisted entity
      results.push entity
  return results

filterWhitelisted = (entity)->
  valid = false
  if entity.claims?.P31?
    valid = validIfIsABook entity.claims, valid
    valid = validIfIsAnAuthor entity.claims, valid
  return valid

rebaseClaimsValueToClaimsRoot = (entity)->
  for id, claim of entity.claims
    if typeof claim is 'object'
      for statement in claim
        switch statement.mainsnak.datatype
          when 'wikibase-item'
            id = statement.mainsnak.datavalue.value['numeric-id']
            statement._id = 'Q' + id
  return

getP31Tester = (matchables)->
  _.type matchables, 'array'
  return tester = (claims, valid)->
    { P31 } = claims
    if P31?
      for statement in P31
        # not altering valid if no match is found has it might be already valided
        # by a previous test
        if statement._id in matchables then valid = true
    return valid

validIfIsABook = getP31Tester(Q.books)

validIfIsAnAuthor = getP31Tester(Q.humans)

whitelistedEntity = (id)-> id in P31Whitelist

resolveWikiUrl = (url)->
  _.log url, 'resolveWikiUrl'
  lang = url.replace /.*\/\/([a-z]{2,3})\..*/, '$1'
  title = url.split('/').last()
  resolveWikiTitle title, lang

resolveWikiTitle = (title, lang='en')->
  url = "#{base}?action=wbgetentities&sites=#{lang}wiki&format=json&props=info&titles=#{title}"
  promises_.get url
  .then _.property('entities')
  .then _.values
  .then _.Log('values')
  .then (entities)-> entities.map(_.property('id'))
  .then _.Log('ids')
  .then (ids)->
    if ids.length isnt 1 then throw new Error 'id not found'
    return ids[0]
  .then _.Log('ids?')
  .catch _.ErrorRethrow('resolveWikiTitle err')


# Only extending with wdk.helpers instead of every wdk functions
# in order to avoid overwritting local functions.
# That said, ideally, local functions should be renamed
# to avoid collisions with wdk functions
module.exports = _.extend wd, wdk.helpers,
  searchEntities: searchEntities
  filterAndBrush: filterAndBrush
  resolveWikiUrl: resolveWikiUrl
