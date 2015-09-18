base = "https://openlibrary.org"
coverBase = "http://covers.openlibrary.org"

cleanedKey = (key)->
  # before: '/books/OL12506329M/James_Bond_contre_docteur_No'
  # after: '/books/OL12506329M'
  return key.split('/')[0..2].join('/')

getUrlFromKey = (key)-> "#{base}#{cleanedKey(key)}.json"

module.exports =
  base: base
  getUrlFromKey: getUrlFromKey
  isbnUrl: (isbn)-> "#{base}/isbn/#{isbn}"
  coverByIsbn: (isbn)-> "#{coverBase}/b/isbn/#{isbn}.jpg"
  coverByOlId: (olId, type='b')-> "#{coverBase}/#{type}/olid/#{olId}.jpg"
  coverByOclcId: (oclcId, type='b')-> "#{coverBase}/#{type}/oclc/#{oclcId}.jpg"
