__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require('sharedLibs','books')(_)
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'

module.exports = (data)->
  if data? and data isnt ''
    key = "image:#{data}"
    cache_.get key, requestImage.bind(null, data)
    .catch (err)-> _.error err, 'getImage err'
  else promises_.reject 'no data provided'


requestImage = (data)->
  promises_.get books.API.google.book(data)
  .then parseThumbnail.bind null, data
  .catch (err)-> _.error err, "google book err for data: #{data}"

parseThumbnail = (data, res)->
  unless res.items?[0]?.volumeInfo?.imageLinks?.thumbnail?
    console.warn "google book image not found for #{data}"
    return

  image = res.items[0].volumeInfo.imageLinks.thumbnail
  return result =
    image: books_.normalize(image)
    data: data