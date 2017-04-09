CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, itemId, userId, entityUri, nonEmptyString, imgUrl } = require './common-tests'
{ constrained, inLocalSnapshot } = require '../attributes/item'

module.exports =
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
  snapshot: (obj)->
    if _.typeOf(obj) isnt 'object' then return false
    for key, value of obj
      unless key in inLocalSnapshot then return false
      unless snapshotTests[key](value) then return false
    return true

snapshotTests =
  'entity:authors': _.isString
  'entity:image': _.isExtendedUrl
  'entity:title': (str)-> nonEmptyString str, 500
  'entity:lang': _.isLang
