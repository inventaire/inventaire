// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let snapshotValidations, validations
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { pass, itemId, userId, entityUri, BoundedString, imgUrl } = require('./common')
const { constrained } = require('../attributes/item')

module.exports = (validations = {
  pass,
  itemId,
  userId,
  entity: entityUri,
  lang: lang => lang ? _.isLang(lang) : true,
  pictures: (pictures) => _.isArray(pictures) && _.every(pictures, imgUrl),
  attribute: (attribute) => {
    let needle
    return (needle = attribute, _.keys(constrained).includes(needle))
  },
  transaction: (transaction) => {
    return constrained.transaction.possibilities.includes(transaction)
  },
  listing: (listing) => {
    return constrained.listing.possibilities.includes(listing)
  },
  details: _.isString,
  notes: _.isString
})

validations.snapshotValidations = (snapshotValidations = {
  'entity:title': BoundedString(1, 500),
  'entity:image': _.isExtendedUrl,
  'entity:lang': _.isLang,
  'entity:authors': _.isString,
  'entity:series': _.isString,
  'entity:ordinal': _.isString
})
