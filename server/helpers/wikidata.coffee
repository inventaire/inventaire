qreq = require 'qreq'
wdProps = _.jsonFile('server/helpers/wikidata-properties-fr.json').properties

module.exports =
  getBookEntities: (query)->
    searchEntities(query.search,query.language)
    .then parseSearchResults
    .then (ids)-> getEntities(ids, [query.language])
    .then filterAndBrush
    .fail (err)-> _.logRed err, 'getBookEntities fail'

  findEntityByFreebaseIdentifier: (freebaseId)->
    # ugly escaping: wdq requires '\/' and you can't just '\\/'
    escapedId = freebaseId.replace('/','%5C/', 'g')
    request = "http://wdq.wmflabs.org/api?q=STRING[646:#{escapedId}]"
    return qreq.get(request)
    .then (res)->
      if res.body.items.length is 1
        return res.body.items[0]
      else throw new Error 'no item found or too many'
    .fail (err)-> console.error(err, 'err at findEntityByFreebaseIdentifier')

searchEntities = (search, language='en', limit='20', format='json')->
  url = "https://www.wikidata.org/w/api.php?action=wbsearchentities&language=#{language}&limit=#{limit}&format=#{format}&search=#{search}".label('searchEntities')
  return qreq.get url

parseSearchResults = (res)->
  results = res.body
  if results.success && results.search.length > 0
    return results.search.map (el)-> el.id
  else
    throw 'not found'

# defaultProps = ['info', 'sitelinks', 'sitelinks', 'aliases', 'labels', 'descriptions', 'claims', 'datatype']
defaultProps = ['info', 'sitelinks', 'labels', 'descriptions', 'claims']
getEntities = (ids, languages=['en'], props=defaultProps, format='json')->
  ids = [ids] if typeof ids is 'string'
  ids = normalizeIds(ids)
  pipedIds = ids.join '|'
  languages.push 'en' unless _.hasValue languages, 'en'
  pipedLanguages = languages.join '|'
  pipedProps = props.join '|'
  query = "https://www.wikidata.org/w/api.php?action=wbgetentities&languages=#{pipedLanguages}&format=#{format}&props=#{pipedProps}&ids=#{pipedIds}".label('getEntities query')
  return qreq.get(query)

filterAndBrush = (res)->
  results = []
  for id,entity of res.body.entities
    rebaseClaimsValueToClaimsRoot entity
    if filterWhitelisted entity
      results.push entity
  return results

filterWhitelisted = (entity)->
  valid = false
  logs = [entity.title, entity.descriptions, entity.labels?.en]
  if entity.claims? && entity.claims.P31?
    logs.push entity.claims.P31
    valid = validIfIsABook(entity.claims, valid)
    valid = validIfIsAnAuthor(entity.claims, valid)
  if valid then _.logArray(logs, 'whitelisted', 'green') else _.logArray(logs, 'rejected', 'red')
  return valid

rebaseClaimsValueToClaimsRoot = (entity)->
  flat =
    claims: new Object
    pictures: new Array
  for id, claim of entity.claims
    propLabel = wdProps[id]
    flat.claims[id] = new Array
    if typeof claim is 'object'
      claim.forEach (statement)->
        switch statement.mainsnak.datatype
          when 'string'
            flat.claims[id].push(statement._value = statement.mainsnak.datavalue.value)
          when 'wikibase-item'
            statement._id = statement.mainsnak.datavalue.value['numeric-id']
            flat.claims[id].push "Q#{statement._id}"
          else flat.claims[id].push(statement.mainsnak)
        if id is 'P18'
          flat.pictures.push _.wmCommonsThumb(statement.mainsnak.datavalue.value)
    flat.claims["#{id} - #{propLabel}"] = flat.claims[id]
  entity.flat = flat

validIfIsABook = (claims, valid)->
  claims.P31.forEach (statement)->
    if _.hasValue BooksP31, statement._id
      valid = true
  return valid

validIfIsAnAuthor = (claims, valid)->
  claims.P31?.forEach (statement)->
    if _.hasValue [5], statement._id
      valid = true
  return valid

whitelistedEntity = (id)-> _.hasValue P31Whitelist, id

BooksP31 = [
  571 #book
  2831984 #comic book album
  1004 # bande dessinée
]

normalizeIds = (idsArray)->
  return idsArray.map normalizeId

normalizeId = (id)->
  if isNumericId(id) then "Q#{id}"
  else if (id[0] is 'Q' or id[0] is 'P') then id
  else throw new Error 'invalid id provided to normalizeIds'

isNumericId = (id)-> /^[0-9]{1,}$/.test id

