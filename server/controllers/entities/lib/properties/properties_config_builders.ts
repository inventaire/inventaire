import { trim } from 'lodash-es'
import { newError } from '#lib/error/error'
import { formatIsbn } from '#lib/isbn/isbn'
import { parseIsbn } from '#lib/isbn/parse'
import { assertString } from '#lib/utils/assert_types'
import { objectValues } from '#lib/utils/base'
import { getPluralType } from '#lib/wikidata/aliases'
import type { EntityType } from '#types/entity'
import { allowedValuesPerTypePerProperty } from './allowed_values_per_type_per_property.js'
import { concurrentAndUniqueString, concurrentAndUniqueExternalId, uniqueEntity } from './properties_config_bases.js'

export function isbnProperty (num: 10 | 13) {
  return {
    ...concurrentAndUniqueString,
    validate: ({ value: isbn }) => {
      if (isbn == null) return false
      const isbnData = parseIsbn(isbn)
      if (isbnData == null) return false
      return isbn === isbnData[`isbn${num}h`]
    },
    uniqueValue: true,
    format: (isbn: string) => formatIsbn(isbn, `${num}h`) || isbn,
    updateAccessLevel: 'admin',
  } as const
}

// External ids regexs can be found
// on their Wikidata property page P1793 statement
export function externalId (regex) {
  return {
    ...concurrentAndUniqueExternalId,
    format: trim,
    validate: ({ value }) => regex.test.bind(regex)(value),
  } as const
}

export function typedExternalId (regexPerType: Partial<Record<EntityType, RegExp>>) {
  return {
    ...concurrentAndUniqueExternalId,
    typeSpecificValidation: true,
    format: trim,
    validate: ({ value, entityType }) => {
      if (entityType) {
        if (regexPerType[entityType] == null) {
          throw newError('unsupported type', 500, { regexPerType, entityType, value })
        }
        return regexPerType[entityType].test(value)
      } else {
        // There are cases where it's hard to pass target the entity type
        // so we just check that one of the known pattern matches
        return objectValues(regexPerType).some(regex => regex.test(value))
      }
    },
  } as const
}

export function allowedPropertyValues (property: keyof typeof allowedValuesPerTypePerProperty) {
  const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
  return {
    ...uniqueEntity,
    typeSpecificValidation: true,
    format: trim,
    validate: ({ value, entityType }) => {
      assertString(entityType)
      const type = getPluralType(entityType)
      return allowedValuesPerType[type].includes(value)
    },
  } as const
}

export function externalIdWithFormatter ({ regex, format }) {
  return {
    ...concurrentAndUniqueExternalId,
    format,
    validate: ({ value }) => regex.test.bind(regex)(value),
  } as const
}

export function caseInsensitiveExternalId (regex: RegExp) {
  return externalIdWithFormatter({
    regex,
    format: str => str.toLowerCase().trim(),
  })
}
