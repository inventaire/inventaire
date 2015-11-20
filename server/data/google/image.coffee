__ = require('config').universalPath
_ = __.require('builders', 'utils')
books_ = __.require 'lib','books'
# directly talking his sibbling to avoid require loops
booksDataFromText = __.require 'data','google/text'
cache_ = __.require 'lib', 'cache'
error_ = __.require 'lib', 'error/error'


module.exports = (data, timespan)->
  unless data? and data isnt ''
    _.warn 'no data provided to request an image'

  key = "image:#{data}"
  cache_.get key, requestImage.bind(null, data), timespan
  .catch _.ErrorRethrow('getImage err')

requestImage = (data)->
  booksDataFromText(data)
  .then parseCachedData.bind(null, data)

parseCachedData = (data, items)->
  inDataWords = InDataWordsTest(data)

  while items?.length > 0
    candidateItem = items.shift()
    if titleMatch candidateItem.title, inDataWords
      image = candidateItem.pictures?[0]
      if image? then break

  if image
    return result =
      image: books_.normalize(image)
      data: data
  else
    _.warn "google book image not found for #{data}"
    return


titleMatch = (title, test)->
  titleWords = title.split(/(\s|')/).map lowercased
  return _.every(titleWords, test)

InDataWordsTest = (data)->
  dataWords = data.split(/(\s|')/).map lowercased
  return inDataWords = (word)-> word in dataWords

lowercased = (str)-> str.toLowerCase()
