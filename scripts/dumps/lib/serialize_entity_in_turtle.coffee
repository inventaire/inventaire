CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ properties } = __.require 'controllers', 'entities/lib/properties'
{ yellow } = require 'chalk'

module.exports = (entity)->
  { _id } = entity

  text = "inv:#{_id} a wikibase:Item ;"

  for lang, value of entity.labels
    formattedLabel = formatStringValue value
    text += """\n  rdfs:label #{formattedLabel}@#{lang} ;"""
    text += """\n  skos:prefLabel #{formattedLabel}@#{lang} ;"""

  for property, propClaims of entity.claims
    { datatype } = properties[property]
    formatter = datatypePropClaimsFormatter[datatype]
    if formatter?
      formattedPropClaims = formatter propClaims
      text += formatPropClaims property, formattedPropClaims
    else
      console.warn yellow('missing formatter'), datatype

  # Replace the last ';' by a '.' and add a line break
  # to have one line between each entity
  return text.replace /;$/, '.\n'

datatypePropClaimsFormatter =
  entity: _.identity
  string: (propClaims)-> propClaims.map formatStringValue
  'positive-integer': (propClaims)-> propClaims.map formatPositiveInteger
  'simple-day': (propClaims)-> propClaims.filter(validSimpleDay).map formatDate
  'image-hash': (propClaims)-> propClaims.map formatImageHash

formatStringValue = (str)->
  str = str
    # May also be of type number
    .toString()
    # Remove parts of a string that would not validate
    # ex: Alone with You (Harlequin Blaze\Made in Montana)
    .replace /\(.*\.*\)/g, ''
    # Replace any special spaces (including line breaks) by a normal space
    .replace /\s/g, ' '
    # Remove double quotes
    .replace /"/g, ''
    # Remove escape caracters
    .replace /\\/g, ''

  return '"' + _.superTrim(str) + '"'

formatPositiveInteger = (number)-> '"+' + number + '"^^xsd:decimal'
formatDate = (simpleDay)->
  sign = if simpleDay[0] is '-' then '-' else ''
  [ year, month, day ] = simpleDay.replace(/^-/, '').split('-')
  year = _.padStart year, 4, '0'
  month or= '01'
  day or= '01'
  formattedDay = "#{sign}#{year}-#{month}-#{day}"
  return '"' + formattedDay + 'T00:00:00Z"^^xsd:dateTime'

# Shouldn't be 0000-00-00 or 0000
validSimpleDay = (simpleDay)-> not /^[0-]+$/.test(simpleDay)

formatImageHash = (imageHash)-> "invimg:#{imageHash}"

formatPropClaims = (property, formattedPropClaims)->
  if formattedPropClaims.length is 0 then return ''
  """\n  #{property} #{formattedPropClaims.join(',\n    ')} ;"""
