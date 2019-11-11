// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const properties = require('./properties_values_constraints')
const whitelist = Object.keys(properties)

// Which type a property value should return when passed to _.typeOf
const propertyType = property => properties[property].type || properties[property].datatype

module.exports = {
  propertyType,

  validateProperty(property){
    if (!/^(wdt|invp):P\d+$/.test(property)) {
      throw error_.new('invalid property', 400, property)
    }

    if (!whitelist.includes(property)) {
      throw error_.new("property isn't whitelisted", 400, { property, whitelist })
    }
  },

  validateValueType(property, value){
    return _.typeOf(value) === propertyType(property)
  }
}
