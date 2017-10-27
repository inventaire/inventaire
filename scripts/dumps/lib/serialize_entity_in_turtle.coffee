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
    switch properties[property].datatype
      when 'entity'
        text += formatPropClaims property, propClaims
      when 'string'
        stringValues = propClaims.map formatStringValue
        text += formatPropClaims property, stringValues
      when 'positive-integer'
        prefixedIntegers = propClaims.map formatPositiveInteger
        text += formatPropClaims property, prefixedIntegers
      when 'simple-day'
        datesValues = propClaims.filter(validSimpleDay).map formatDate
        text += formatPropClaims property, datesValues

  # Replace the last ';' by a '.'
  return text.replace /;$/, '.\n'

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
