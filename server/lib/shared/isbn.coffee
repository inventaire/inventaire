# Removing any non-alpha numeric characters, especially '-' and spaces
normalizeIsbn = (text)-> text.replace /\W/g, ''

isNormalizedIsbn = (text)-> /^(97(8|9))?\d{9}(\d|X)$/.test text

# Stricter ISBN validation is done on the server but would be too expensive
# to do client-side: so the trade-off is that invalid ISBN
# might not be spotted client-side until refused by the server
looksLikeAnIsbn = (text)->
  unless typeof text is 'string' then return false
  cleanedText = normalizeIsbn text
  if isNormalizedIsbn cleanedText
    switch cleanedText.length
      when 10 then return 10
      when 13 then return 13
  return false

module.exports = { normalizeIsbn, isNormalizedIsbn, looksLikeAnIsbn }
