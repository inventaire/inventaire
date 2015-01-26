__ = require('config').root
_ = __.require('builders', 'utils')
books_ = __.require('sharedLibs','books')(_)
# directly talking his sibbling to avoid require loops
booksDataFromText = __.require 'data','google/text'
cache_ = __.require 'lib', 'cache'
promises_ = __.require 'lib', 'promises'

module.exports = (data, timespan)->
  if data? and data isnt ''
    key = "image:#{data}"
    cache_.get key, requestImage.bind(null, data), timespan
    .catch (err)-> _.error err, 'getImage err'
  else promises_.reject 'no data provided'


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