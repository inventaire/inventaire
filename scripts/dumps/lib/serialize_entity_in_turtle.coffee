CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ properties } = __.require 'controllers','entities/lib/properties'

module.exports = (entity)->
  { _id } = entity

  text = "inv:#{_id} a wikibase:Item ;"

  for lang, value of entity.labels
    text += """\n  rdfs:label #{formatStringValue(value)}@#{lang} ;"""
    text += """\n  skos:prefLabel #{formatStringValue(value)}@#{lang} ;"""

  for property, propClaims of entity.claims
    { datatype } = properties[property]
    formatter = datatypePropClaimsFormatter[datatype]
    if formatter?
      formattedPropClaims = formatter propClaims
      text += formatPropClaims property, formattedPropClaims

  # Replace the last ';' by a '.' and add a line break
  # to have one line between each entity
  return text.replace /;$/, '.\n'

datatypePropClaimsFormatter =
  entity: _.identity
  string: (propClaims)-> propClaims.map formatStringValue
  'positive-integer': (propClaims)-> propClaims.map formatPositiveInteger
  'simple-day': (propClaims)-> propClaims.filter(validSimpleDay).map formatDate

formatStringValue = (str)->
  # May also be of type number
  str = str.toString()

  # Remove parts of a string that would not validate
  # ex: Alone with You (Harlequin Blaze\Made in Montana)
  str = str.replace /\(.*\.*\)/g, ''

  if str.match('"')? then "'''" +  str.replace(/'''/g, '') + "'''"
  else '"' + str + '"'

formatPositiveInteger = (number)-> '"+' + number + '"^^xsd:decimal'
formatDate = (simpleDay)->
  if simpleDay.length is 4 then simpleDay += '-01-01'
  return '"' + simpleDay + 'T00:00:00Z"^^xsd:dateTime'

# Shouldn't be 0000-00-00 or 0000
validSimpleDay = (simpleDay)-> not /^[0-]+$/.test(simpleDay)

formatPropClaims = (property, formattedPropClaims)->
  if formattedPropClaims.length is 0 then return ''
  """\n  #{property} #{formattedPropClaims.join(',\n    ')} ;"""
