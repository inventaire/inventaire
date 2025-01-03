import { identity, padStart } from 'lodash-es'
import { yellow } from 'tiny-chalk'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getPropertyDatatype } from '#controllers/entities/lib/properties/properties_values_constraints'
import { superTrim } from '#lib/utils/base'

export default entity => {
  const { _id, version, created, updated, type, redirect } = entity

  if (type !== 'entity' || redirect != null) return ''

  let text = `inv:${_id} a wikibase:Item ;`

  if (created) {
    const dateCreated = new Date(created).toISOString()
    text += `\n  schema:dateCreated "${dateCreated}"^^xsd:dateTime ;`
  } else {
    console.warn(yellow('missing "created" timestamp'), _id)
  }

  if (updated) {
    const dateModified = new Date(updated).toISOString()
    text += `\n  schema:dateModified "${dateModified}"^^xsd:dateTime ;`
  }

  text += `\n  schema:version ${version} ;`

  for (const lang in entity.labels) {
    const value = entity.labels[lang]
    const formattedLabel = formatStringValue(value)
    text += `\n  rdfs:label ${formattedLabel}@${lang} ;`
  }

  let statementsCount = 0

  for (const property in entity.claims) {
    statementsCount += 1
    // TODO: serialize references
    const propClaims = entity.claims[property].map(getClaimValue)
    const datatype = getPropertyDatatype(property)
    if (datatype) {
      const formatter = datatypePropClaimsFormatter[datatype]
      if (formatter != null) {
        const formattedPropClaims = formatter(propClaims)
        text += formatPropClaims(property, formattedPropClaims)
      } else {
        console.warn(yellow('missing formatter'), datatype)
      }
    } else {
      console.warn(yellow('unknown property'), { property, type, _id })
    }
  }

  text += `\n  wikibase:statements ${statementsCount} ;`

  const labelsCount = Object.keys(entity.labels).length
  // This property isn't actually used by Wikidata
  // but builds on the idea of 'wikibase:statements'
  text += `\n  wikibase:labels ${labelsCount} ;`

  // Replace the last ';' by a '.' and add a line break
  // to have one line between each entity
  return text.replace(/;$/, '.\n')
}

const stringPropClaimsFormatter = propClaims => propClaims.map(formatStringValue)
const datatypePropClaimsFormatter = {
  entity: identity,
  string: stringPropClaimsFormatter,
  url: stringPropClaimsFormatter,
  'external-id': stringPropClaimsFormatter,
  'positive-integer': propClaims => propClaims.map(formatPositiveInteger),
  'positive-integer-string': stringPropClaimsFormatter,
  date: propClaims => propClaims.filter(validSimpleDay).map(formatDate),
  image: propClaims => propClaims.map(formatImageHash),
}

const formatStringValue = (str: string) => {
  str = str
    // May also be of type number
    .toString()
    // Remove parts of a string that would not validate
    // ex: Alone with You (Harlequin Blaze\Made in Montana)
    .replace(/\(.*\.*\)/g, '')
    // Replace any special spaces (including line breaks) by a normal space
    .replace(/\s/g, ' ')
    // Remove double quotes
    .replaceAll('"', '')
    // Remove escape caracters
    .replaceAll('\\', '')

  return `"${superTrim(str)}"`
}

const formatPositiveInteger = number => `"+${number}"^^xsd:decimal`
const formatDate = simpleDay => {
  const sign = simpleDay[0] === '-' ? '-' : ''
  let [ year, month, day ] = simpleDay.replace(/^-/, '').split('-')
  year = padStart(year, 4, '0')
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
