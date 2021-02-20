const CONFIG = require('config')
const __ = CONFIG.universalPath
const isbn_ = __.require('lib', 'isbn/isbn')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { concurrentString, uniqueEntity } = require('./properties_config_bases')
const propertiesValuesPerTypesLists = require('./properties_values_per_types_lists')
const { getPluralType } = __.require('lib', 'wikidata/aliases')

module.exports = {
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
    const propertyValuesPerType = propertiesValuesPerTypesLists[property]
    return Object.assign({}, uniqueEntity, {
      typeSpecificValidation: true,
      validate: (entityUri, entityType) => {
        const type = getPluralType(entityType)
        return propertyValuesPerType[type].includes(entityUri)
      }
    })
  }
}
