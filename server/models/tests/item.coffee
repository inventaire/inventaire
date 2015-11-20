CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, itemId, userId, entityUri, nonEmptyString, imgUrl } = require './common-tests'
{ constrained } = require '../attributes/item'

module.exports =
  pass: pass
  itemId: itemId
  userId: userId
  entity: entityUri
  title: nonEmptyString
  pictures: (pictures)-> _.isArray(pictures) and _.all(pictures, imgUrl)
  transaction: (transaction)->
    transaction in constrained.transaction.possibilities
  listing: (listing)->
    listing in constrained.listing.possibilities
  details: _.isString
  notes: _.isString
