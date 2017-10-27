CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ properties } = __.require 'controllers','entities/lib/properties'

module.exports = (entity)->
  { _id } = entity

  text = "\ninv:#{_id} a wikibase:Item ;"

  for lang, value of entity.labels
    text += """\n  rdfs:label "#{escapeDoubleQuotes(value)}"@#{lang} ;"""
    text += """\n  skos:prefLabel "#{escapeDoubleQuotes(value)}"@#{lang} ;"""

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
        datesValues = propClaims.map formatDate
        text += formatPropClaims property, datesValues

  return text + '\n'

escapeDoubleQuotes = (str)-> str.replace '"', '\\"'
formatStringValue = (str)-> '"' + str + '"'
formatPositiveInteger = (number)-> '+"' + number + '"^^xsd:decimal'
formatDate = (simpleDay)->
  if simpleDay.length is 4 then simpleDay += '-01-01'
  return '"' + simpleDay + 'T00:00:00Z"^^xsd:dateTime'

formatPropClaims = (property, formattedPropClaims)->
  """\n  #{property} #{formattedPropClaims.join(',\n    ')} ;"""