CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, itemId, userId, entityUri, BoundedString, imgUrl } = require './common'
{ constrained } = require '../attributes/item'

module.exports = validations =
  pass: pass
  itemId: itemId
  userId: userId
  entity: entityUri
  lang: (lang)-> if lang then _.isLang(lang) else true
  pictures: (pictures)-> _.isArray(pictures) and _.all(pictures, imgUrl)
  transaction: (transaction)->
    transaction in constrained.transaction.possibilities
  listing: (listing)->
    return listing in constrained.listing.possibilities
  details: _.isString
  notes: _.isString

validations.snapshotValidations = snapshotValidations =
  'entity:title': BoundedString 1, 500
  'entity:image': _.isExtendedUrl
  'entity:lang': _.isLang
  'entity:authors': _.isString
  'entity:series': _.isString
  'entity:ordinal': _.isString
