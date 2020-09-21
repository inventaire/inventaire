const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { pass, itemId, userId, entityUri, BoundedString, imgUrl } = require('./common')
const { constrained } = require('../attributes/item')
const constrainedAttributes = Object.keys(constrained)

module.exports = {
  pass,
  itemId,
  userId,
  entity: entityUri,
  lang: lang => lang ? _.isLang(lang) : true,
  pictures: pictures => _.isArray(pictures) && _.every(pictures, imgUrl),
  attribute: attribute => constrainedAttributes.includes(attribute),
  transaction: transaction => {
    return constrained.transaction.possibilities.includes(transaction)
  },
  listing: listing => {
    return constrained.listing.possibilities.includes(listing)
  },
  details: _.isString,
  notes: _.isString,
  snapshotValidations: {
    'entity:title': BoundedString(1, 500),
    'entity:image': _.isExtendedUrl,
    'entity:lang': _.isLang,
    'entity:authors': _.isString,
    'entity:series': _.isString,
    'entity:ordinal': _.isString
  }
}
