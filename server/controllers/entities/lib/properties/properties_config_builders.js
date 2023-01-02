import { error_ } from '#lib/error/error'
import { formatIsbn } from '#lib/isbn/isbn'
import { parseIsbn } from '#lib/isbn/parse'
import { assert_ } from '#lib/utils/assert_types'
import { getPluralType } from '#lib/wikidata/aliases'
import allowedValuesPerTypePerProperty from './allowed_values_per_type_per_property.js'
import { concurrentString, uniqueEntity } from './properties_config_bases.js'

export const isbnProperty = num => {
  return Object.assign({}, concurrentString, {
    validate: isbn => {
      if (isbn == null) return false
      const isbnData = parseIsbn(isbn)
      if (isbnData == null) return false
      return isbn === isbnData[`isbn${num}h`]
    },
    uniqueValue: true,
    format: isbn => formatIsbn(isbn, `${num}h`),
    adminUpdateOnly: true,
  })
}

// External ids regexs can be found
// on their Wikidata property page P1793 statement
export const externalId = regex => {
  return Object.assign({}, concurrentString, {
    validate: regex.test.bind(regex),
    isExternalId: true,
  })
}

export const typedExternalId = regexPerType => {
  return Object.assign({}, concurrentString, {
    typeSpecificValidation: true,
    isExternalId: true,
    validate: (value, entityType) => {
      assert_.string(entityType)
      if (regexPerType[entityType] == null) {
        throw error_.new('unsupported type', 500, { regexPerType, entityType, value })
      }
      return regexPerType[entityType].test(value)
    },
  })
}

export const allowedPropertyValues = property => {
  const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
  return Object.assign({}, uniqueEntity, {
    typeSpecificValidation: true,
    validate: (entityUri, entityType) => {
      const type = getPluralType(entityType)
      return allowedValuesPerType[type].includes(entityUri)
    },
  })
}
