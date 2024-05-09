import { trim } from 'lodash-es'
import { newError } from '#lib/error/error'
import { formatIsbn } from '#lib/isbn/isbn'
import { parseIsbn } from '#lib/isbn/parse'
import { assert_ } from '#lib/utils/assert_types'
import { getPluralType } from '#lib/wikidata/aliases'
import { allowedValuesPerTypePerProperty } from './allowed_values_per_type_per_property.js'
import { concurrentString, concurrentExternalId, uniqueEntity } from './properties_config_bases.js'

export function isbnProperty (num: 10 | 13) {
  return {
    ...concurrentString,
    validate: ({ value: isbn }) => {
      if (isbn == null) return false
      const isbnData = parseIsbn(isbn)
      if (isbnData == null) return false
      return isbn === isbnData[`isbn${num}h`]
    },
    uniqueValue: true,
    format: (isbn: string) => formatIsbn(isbn, `${num}h`) || isbn,
    adminUpdateOnly: true,
  } as const
}

// External ids regexs can be found
// on their Wikidata property page P1793 statement
export function externalId (regex) {
  return {
    ...concurrentExternalId,
    format: trim,
    validate: ({ value }) => regex.test.bind(regex)(value),
  } as const
}

export function typedExternalId (regexPerType) {
  return {
    ...concurrentExternalId,
    typeSpecificValidation: true,
    format: trim,
    validate: ({ value, entityType }) => {
      assert_.string(entityType)
      if (regexPerType[entityType] == null) {
        throw newError('unsupported type', 500, { regexPerType, entityType, value })
      }
      return regexPerType[entityType].test(value)
    },
  } as const
}

export function allowedPropertyValues (property) {
  const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
  return {
    ...uniqueEntity,
    typeSpecificValidation: true,
    format: trim,
    validate: ({ value, entityType }) => {
      const type = getPluralType(entityType)
      return allowedValuesPerType[type].includes(value)
    },
  } as const
}

export function externalIdWithFormatter ({ regex, format }) {
  return {
    ...concurrentExternalId,
    format,
    validate: ({ value }) => regex.test.bind(regex)(value),
  } as const
}
