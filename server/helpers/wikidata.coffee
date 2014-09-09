qreq = require 'qreq'
wdProps = _.jsonFile('server/helpers/wikidata-properties-fr.json').properties

module.exports =
  getBookEntities: (query)->
    searchEntities(query.search, query.language)
    .then (res)->
      _.logGreen res.body, 'searchEntities res'
      if res.body.success and res.body.search.length > 0
        return res.body.search.map (el)-> el.id
      else throw new Error 'not found'
    .then (ids)->
      _.logGreen ids, 'wd ids found'
      getEntities(ids, [query.language])
    .then filterAndBrush

  getBookEntityByISBN: (isbn, type, lang)->
    switch type
      when 10
        request = "http://wdq.wmflabs.org/api?q=STRING[957:#{isbn}]"
      when 13
        request = "http://wdq.wmflabs.org/api?q=STRING[212:#{isbn}]"
    return qreq.get(request)
    .then (res)->
      if res.body.items.length > 0
        id = normalizeId(res.body.items[0])
        return getEntities(id, lang)
        .then(filterAndBrush)
        .then (resultArray)-> return {items: filterAndBrush, source: 'wd', isbn: isbn}
      else return {status: 'no item found for this isbn', isbn: isbn, items: [], source: 'wd'}
    .fail (err)-> console.error(err, 'err at getBookEntityByISBN')


searchEntities = (search, language='en', limit='20', format='json')->
  url = _.buildPath('https://www.wikidata.org/w/api.php',
    action: 'wbsearchentities'
    language: language
    limit: limit
    format: format
    search: search
  ).logIt('searchEntities')
  return qreq.get url

# defaultProps = ['info', 'sitelinks', 'sitelinks', 'aliases', 'labels', 'descriptions', 'claims', 'datatype']
defaultProps = ['info', 'sitelinks', 'labels', 'descriptions', 'claims']
getEntities = (ids, languages=['en'], props=defaultProps, format='json')->
  ids = [ids] if typeof ids is 'string'
  languages = [languages]  if typeof languages is 'string' and languages isnt ''
  languages.push 'en'
  languages = _.toSet(languages).join('|')

  query = _.buildPath('https://www.wikidata.org/w/api.php',
    action: 'wbgetentities'
    languages: languages
    format: format
    props: props.join '|'
    ids: normalizeIds(ids).join '|'
  ).logIt('getEntities query')
  return qreq.get(query)

filterAndBrush = (res)->
  results = []
  for id,entity of res.body.entities
    rebaseClaimsValueToClaimsRoot entity
    if filterWhitelisted entity
      results.push entity
  _.log results, 'filterAndBrush results'
  return results

justBrush = (res)->
  results = []
  for id,entity of res.body.entities
    rebaseClaimsValueToClaimsRoot entity
    results.push entity
  return results

filterWhitelisted = (entity)->
  valid = false
  logs = [ ['title', entity.title], 'desc', entity.descriptions, ['label.en', entity.labels?.en]]
  if entity.claims? and entity.claims.P31?
    logs.push 'P31'
    logs.push entity.claims.P31
    valid = validIfIsABook(entity.claims, valid)
    valid = validIfIsAnAuthor(entity.claims, valid)
  if valid then _.logArray(logs, 'whitelisted', 'green')
  else _.logArray(logs, 'rejected', 'red')
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
  8261 #roman
  25379 #theatre play
]

AuthorsP31 = [5]

normalizeIds = (idsArray)->
  return idsArray.map normalizeId

normalizeId = (id)->
  if isNumericId(id) then "Q#{id}"
  else if isNormalizedId(id) then id
  else throw new Error 'invalid id provided to normalizeIds'

numericId = (id)->
  if isNormalizedId(id) then id[1..]
  else id

isNormalizedId = (id)-> /^(P|Q)[0-9]+$/.test id
isNumericId = (id)-> /^[0-9]+$/.test id


bookOrAuthorFilteredSearch = (text, lang)->
  ids = BooksP31.concat(AuthorsP31)
  return P31FilteredSearch(ids, text, lang)

bookFilteredSearch = (text, lang)->
  return P31FilteredSearch(BooksP31, text, lang)

P31FilteredSearch = (ids, text, lang)->
  claimsStringsArray = ids.map (el)-> "claim[31:#{el}]"
  claim = claimsStringsArray.join(' OR ')
  _.logBlue claim = "(#{claim})", 'claim'
  return filteredSearch(text, claim, lang)

filteredSearch = (text, claim, lang, limit=15)->
  console.time('filteredSearch')
  return searchEntities(text, lang, limit)
  .then filteredResultsIds
  .then (numericIds)-> filteredIdsByClaim(numericIds, claim)
  .then (res)->
    console.timeEnd('filteredSearch')
    if res.body.items.length > 0
      filteredIds = normalizeIds(res.body.items)
      return getEntities(filteredIds, lang).then(justBrush)
    else throw new Error 'no ids left after filteredIdsByClaim'
  .fail (err)-> console.error(err, 'err at filteredSearch')

filteredResultsIds = (res)->
  if res.body?.search?.length > 0
    return numericIds = res.body.search.map (el)-> el.id[1..]
  else throw new Error 'no item found at filterIds'

filteredIdsByClaim = (numericIds, claim)->
  ids = numericIds.join(',')
  query = "items[#{ids}] AND #{claim}"
  request = "http://wdq.wmflabs.org/api?q=#{query}".label 'filteredIdsByClaim'
  return qreq.get request


module.exports.filteredSearch = filteredSearch
module.exports.bookFilteredSearch = bookFilteredSearch
module.exports.bookOrAuthorFilteredSearch = bookOrAuthorFilteredSearch
module.exports.findEntityByFreebaseIdentifier = (freebaseId)->
  # ugly escaping: wdq requires '\/' and you can't just '\\/'
  escapedId = freebaseId.replace('/','%5C/', 'g')
  request = "http://wdq.wmflabs.org/api?q=STRING[646:#{escapedId}]"
  return qreq.get(request)
  .then (res)->
    if res.body.items.length is 1
      return res.body.items[0]
    else throw new Error 'no item found or too many'
  .fail (err)-> console.error(err, 'err at findEntityByFreebaseIdentifier')
