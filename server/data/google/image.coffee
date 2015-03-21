__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require('sharedLibs','books')(_)
# directly talking his sibbling to avoid require loops
booksDataFromText = __.require 'data','google/text'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'


module.exports = (data, timespan)->
  unless data? and data isnt ''
    error_.reject 'no data provided'

  key = "image:#{data}"
  cache_.get key, requestImage.bind(null, data), timespan
  .catch (err)-> _.error err, 'getImage err'


requestImage = (data)->
  booksDataFromText(data)
  .then parseCachedData.bind(null, data)
  .catch (err)-> _.error err, "google book err for data: #{data}"

parseCachedData = (data, res)->
  unless res?[0]?.pictures?[0]?
    console.warn "google book image not found for #{data}"
    return

  image = res[0].pictures[0]
  return result =
    image: books_.normalize(image)
    data: data