// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const isbn_ = __.require('lib', 'isbn/isbn')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { concurrentString } = require('./properties_config_bases')

module.exports = {
  isbnProperty: num => {
    return _.extend({}, concurrentString, {
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
    return _.extend({}, concurrentString, {
      validate: regex.test.bind(regex),
      isExternalId: true
    })
  },

  typedExternalId: regexPerType => {
    return _.extend({}, concurrentString, {
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
  }
}
