__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'
items_ = __.require 'controllers', 'items/lib/items'
entities_ = __.require 'controllers', 'entities/lib/entities'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getOpenLibraryDataFromIsbn =  __.require 'data', 'openlibrary/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'

module.exports = (isbn)->
  promises_.props
    openlibrary: getOpenLibraryDataFromIsbn(isbn).catch preventCrash
    google: getGoogleDataFromIsbn(isbn).catch preventCrash
    inv: getInvEntitiesDataFromIsbn(isbn).catch preventCrash

  # give priority to inv data as those can be fixed
  # while errors from google can't
  # ex: isbn 9782253005438 is wrong in Google Books
  .then (res)->
    data = res.inv or res.openlibrary or res.google
    if data then return data
    else return tryToCreateEntityFromItems isbn

# stop the error propagation to make sure that one source failing
# doesn't crash the whole response
preventCrash = (err)->
  # no need to log if one source returned a 404
  unless err.status is 404
    _.error err, 'error catched to prevent promise settle crash'
  return

tryToCreateEntityFromItems = (isbn)->
  _.log isbn, 'tryToCreateEntityFromItems'
  items_.byIsbn isbn
  .then (items)->
    if items.length is 0 then return {}

    # unless created at the same time, there is no reason
    # to find more than one item here as the next item should
    # find this newly created entity
    { title, authors, pictures, owner } = items[0]
    unless _.isNonEmptyString title then return {}

    entityData =
      isbn: isbn
      title: title
      pictures: pictures

    if _.isNonEmptyString authors
      entityData.authors = [ authors ]

    entities_.create entityData, owner
    .then _.Log('created entity')
    .then (entity)->
      entity.source = 'inv'
      return entity
