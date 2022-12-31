import isbn_ from 'lib/isbn/isbn'
import error_ from 'lib/error/error'
import assert_ from 'lib/utils/assert_types'
import { concurrentString, uniqueEntity } from './properties_config_bases'
import allowedValuesPerTypePerProperty from './allowed_values_per_type_per_property'
import { getPluralType } from 'lib/wikidata/aliases'

export default {
  isbnProperty: num => {
    return Object.assign({}, concurrentString, {
      validate: isbn => {
        if (isbn == null) return false
        const isbnData = isbn_.parse(isbn)
        if (isbnData == null) return false
        return isbn === isbnData[`isbn${num}h`]
      },
      uniqueValue: true,
      format: isbn_[`toIsbn${num}h`],
      adminUpdateOnly: true
    })
  },

  // External ids regexs can be found
  // on their Wikidata property page P1793 statement
  externalId: regex => {
    return Object.assign({}, concurrentString, {
      validate: regex.test.bind(regex),
      isExternalId: true
    })
  },

  typedExternalId: regexPerType => {
    return Object.assign({}, concurrentString, {
      typeSpecificValidation: true,
      isExternalId: true,
      validate: (value, entityType) => {
        assert_.string(entityType)
        if (regexPerType[entityType] == null) {
          throw error_.new('unsupported type', 500, { regexPerType, entityType, value })
        }
        return regexPerType[entityType].test(value)
      }
    })
  },

  allowedPropertyValues: property => {
    const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
    return Object.assign({}, uniqueEntity, {
      typeSpecificValidation: true,
      validate: (entityUri, entityType) => {
        const type = getPluralType(entityType)
        return allowedValuesPerType[type].includes(entityUri)
      }
    })
  }
}
