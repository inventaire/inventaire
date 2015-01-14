__ = require('config').root
_ = __.require('builders', 'utils')

promises_ = require './promises'
module.exports = __.require('sharedLibs','books')(_)

module.exports.getDataFromIsbn = __.require 'data', 'isbn'

module.exports.getDataFromText = __.require 'data', 'text'

module.exports.getImage = (data)->
  promises_.get @API.google.book(data)
  .then (res)=>
    if res.items?[0]?.volumeInfo?.imageLinks?.thumbnail?
      image = res.items[0].volumeInfo.imageLinks.thumbnail
      return {image: @normalize(image), data: data}
    else console.warn "google book image not found for #{data}"
  .catch (err)-> _.error err, "google book err for data: #{data}"