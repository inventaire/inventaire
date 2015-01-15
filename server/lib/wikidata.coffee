__ = require('config').root
_ = __.require('builders', 'utils')

promises_ = require './promises'
wd = __.require('sharedLibs', 'wikidata')(promises_, _)
wd.sitelinks = __.require 'sharedLibs','wiki_sitelinks'
module.exports = wd

Q = wd.Q

module.exports.searchEntities = (search, language='en', limit='20', format='json')->
  url = wd.API.wikidata.search(search, language).logIt('searchEntities')
  return promises_.get url

module.exports.filterAndBrush = (res)->
  results = []
  for id,entity of res.entities
    rebaseClaimsValueToClaimsRoot entity
    if filterWhitelisted entity
      results.push entity
  return results

justBrush = (res)->
  results = []
  for id,entity of res.entities
    rebaseClaimsValueToClaimsRoot entity
    results.push entity
  return results

filterWhitelisted = (entity)->
  valid = false
  logs = [ ['title', entity.title], 'desc', entity.descriptions, ['label.en', entity.labels?.en]]
  if entity.claims?.P31?
    logs.push 'P31'
    logs.push entity.claims.P31
    valid = validIfIsABook entity.claims, valid
    valid = validIfIsAnAuthor entity.claims, valid
  if valid then _.logArray(logs, 'whitelisted', 'green')
  else _.logArray(logs, 'rejected', 'red')
  return valid

rebaseClaimsValueToClaimsRoot = (entity)->
  for id, claim of entity.claims
    if typeof claim is 'object'
      claim.forEach (statement)->
        switch statement.mainsnak.datatype
          when 'wikibase-item'
            id = statement.mainsnak.datavalue.value['numeric-id']
            statement._id = 'Q' + id
  return

getP31Tester = (matchables)->
  _.type matchables, 'array'
  return tester = (claims, valid)->
    claims.P31?.forEach (statement)->
      if statement._id in matchables then valid = true
    return valid

validIfIsABook = getP31Tester(Q.books)

validIfIsAnAuthor = getP31Tester(Q.humans)

whitelistedEntity = (id)-> id in P31Whitelist
