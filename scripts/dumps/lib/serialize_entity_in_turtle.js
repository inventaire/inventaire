const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const properties = __.require('controllers', 'entities/lib/properties/properties_values_constraints')
const { yellow } = require('chalk')

module.exports = entity => {
  const { _id } = entity

  let text = `inv:${_id} a wikibase:Item ;`

  for (const lang in entity.labels) {
    const value = entity.labels[lang]
    const formattedLabel = formatStringValue(value)
    text += `\n  rdfs:label ${formattedLabel}@${lang} ;`
    text += `\n  skos:prefLabel ${formattedLabel}@${lang} ;`
  }

  for (const property in entity.claims) {
    const propClaims = entity.claims[property]
    const { datatype } = properties[property]
    const formatter = datatypePropClaimsFormatter[datatype]
    if (formatter != null) {
      const formattedPropClaims = formatter(propClaims)
      text += formatPropClaims(property, formattedPropClaims)
    } else {
      console.warn(yellow('missing formatter'), datatype)
    }
  }

  // Replace the last ';' by a '.' and add a line break
  // to have one line between each entity
  return text.replace(/;$/, '.\n')
}

const datatypePropClaimsFormatter = {
  entity: _.identity,
  string: propClaims => propClaims.map(formatStringValue),
  'positive-integer': propClaims => propClaims.map(formatPositiveInteger),
  'simple-day': propClaims => propClaims.filter(validSimpleDay).map(formatDate),
  'image-hash': propClaims => propClaims.map(formatImageHash)
}

const formatStringValue = str => {
  str = str
    // May also be of type number
    .toString()
    // Remove parts of a string that would not validate
    // ex: Alone with You (Harlequin Blaze\Made in Montana)
    .replace(/\(.*\.*\)/g, '')
    // Replace any special spaces (including line breaks) by a normal space
    .replace(/\s/g, ' ')
    // Remove double quotes
    .replace(/"/g, '')
    // Remove escape caracters
    .replace(/\\/g, '')

  return `"${_.superTrim(str)}"`
}

const formatPositiveInteger = number => `"+${number}"^^xsd:decimal`
const formatDate = simpleDay => {
  const sign = simpleDay[0] === '-' ? '-' : ''
  let [ year, month, day ] = simpleDay.replace(/^-/, '').split('-')
  year = _.padStart(year, 4, '0')
  if (!month) { month = '01' }
  if (!day) { day = '01' }
  const formattedDay = `${sign}${year}-${month}-${day}`
  return `"${formattedDay}T00:00:00Z"^^xsd:dateTime`
}

// Shouldn't be 0000-00-00 or 0000
const validSimpleDay = simpleDay => !/^[0-]+$/.test(simpleDay)

const formatImageHash = imageHash => `invimg:${imageHash}`

const formatPropClaims = (property, formattedPropClaims) => {
  if (formattedPropClaims.length === 0) return ''
  return `\n  ${property} ${formattedPropClaims.join(',\n    ')} ;`
}
