__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = __.require 'lib', 'promises'
items_ = __.require 'controllers', 'items/lib/items'
entities_ = __.require 'lib', 'entities'

getGoogleDataFromIsbn =  __.require 'data', 'google/isbn'
getOpenLibraryDataFromIsbn =  __.require 'data', 'openlibrary/isbn'
getInvEntitiesDataFromIsbn =  __.require 'data', 'inv/isbn'

module.exports = (isbn)->
  promises_.settleProps
    openlibrary: getOpenLibraryDataFromIsbn(isbn)
    google: getGoogleDataFromIsbn(isbn)
    inv: getInvEntitiesDataFromIsbn(isbn)

  # give priority to inv data as those can be fixed
  # while errors from google can't
  # ex: isbn 9782253005438 is wrong in Google Books
  .then (res)->
    data = res.inv or res.openlibrary or res.google
    if data then return data
    else return tryToCreateEntityFromItems isbn

tryToCreateEntityFromItems = (isbn)->
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

    return entities_.create entityData, owner
