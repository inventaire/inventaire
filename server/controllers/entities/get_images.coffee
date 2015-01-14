__ = require('config').root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
cache_ = __.require 'lib', 'cache'
books = __.require 'lib', 'books'

module.exports = getImages = (req, res)->
  dataArray = req.query.data.split '|'
  unless dataArray? then return res.json 400, 'bad query'

  promises = dataArray.map getImage

  promises_.settle(promises)
  .then res.json.bind(res)
  .catch (err)-> _.errorHandler res, err

getImage = (data)->
  if data? and data isnt ''
    key = "image:#{data}"
    cache_.get key, books.getImage, books, [data]
    .catch (err)-> _.error err, 'getImage err'
  else promises_.reject('no data provided')