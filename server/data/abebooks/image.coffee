CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
books_ = __.require 'lib', 'books'
hyphenate = false
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'

module.exports = (isbn)->
  isbn13 = books_.toIsbn13 isbn, hyphenate
  unless isbn13?
    return promises_.reject error_.new 'invalid isbn', 400, isbn

  url = buildUrl isbn13
  key = "abebooks:#{isbn13}"

  cache_.get key, hasImage.bind(null, url)
  .then _.Log('abebooks has an image')
  .then (bool)->
    if bool then { image: url }
    else throw notFound url
  .then _.Log('abebooks image')

buildUrl = (isbn)-> "http://pictures.abebooks.com/isbn/#{isbn}-us.jpg"

hasImage = (url)->
  promises_.head url
  .then (res)->
    { statusCode, headers } = res
    if statusCode is 200 and headers['content-type'] is 'image/jpeg'
      return true
    else
      return false
  .catch (err)->
    if err.statusCode is 403 then return false
    else throw err

notFound = (url)-> error_.new 'abebooks image not found', 404, url
