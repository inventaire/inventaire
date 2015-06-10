CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
{ pass, itemId, userId, entityUri, isNonEmptyString } = require './common-tests'
{ constrained } = require '../attributes/item'

module.exports =
  pass: pass
  itemId: itemId
  userId: userId
  entity: entityUri
  title: isNonEmptyString
  pictures: (pictures)-> _.isArray(pictures) and _.all(pictures, _.isUrl)
  transaction: (transaction)->
    transaction in constrained.transaction.possibilities
  listing: (listing)->
    listing in constrained.listing.possibilities
  details: _.isString
  notes: _.isString
