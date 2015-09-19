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
  searchUrl: (text)-> "#{base}/search?q=#{text}"
  isbnUrl: (isbn)-> "#{base}/isbn/#{isbn}"
  coverById: (id, type='b')-> "#{coverBase}/#{type}/id/#{id}.jpg"
  coverByOlId: (olId, type='b')-> "#{coverBase}/#{type}/olid/#{olId}.jpg"
  coverByIsbn: (isbn)-> "#{coverBase}/b/isbn/#{isbn}.jpg"
  coverByOclcId: (oclcId, type='b')-> "#{coverBase}/#{type}/oclc/#{oclcId}.jpg"
