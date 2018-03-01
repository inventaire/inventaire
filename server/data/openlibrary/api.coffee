coverBase = 'http://covers.openlibrary.org'

module.exports =
  coverByOlId: (olId, type='b')-> "#{coverBase}/#{type}/olid/#{olId}.jpg"
