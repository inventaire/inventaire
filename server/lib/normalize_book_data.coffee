__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (books_)->
  normalizeBookData: (cleanedItem, isbn)->
    data = _.pick cleanedItem, 'title', 'authors', 'description', 'publisher', 'publishedDate', 'language', 'pageCount'

    data.pictures = []

    {industryIdentifiers, imageLinks} = cleanedItem

    if industryIdentifiers?
      for obj in industryIdentifiers
        switch obj.type
          when 'ISBN_10' then data.P957 = obj.identifier
          when 'ISBN_13' then data.P212 = obj.identifier
          when 'OTHER' then otherId = obj.identifier

    # if an isbn was provided, verify that its matching the data
    if isbn?
      unless isbn is data.P212 or isbn is data.P957
        _.warn industryIdentifiers, "this isnt the isbn we are looking for (#{isbn})"
        return

    # prefer isbn-13 when available
    # create isbn variable when not passed
    isbn or= data.P212 or data.P957

    if isbn?
      data.id = data.uri = "isbn:#{isbn}"
      data.isbn = isbn
    else if otherId? then data.id = data.uri = otherId
    else
      _.warn data.title, 'no id found at normalizeBookData. Will be droped'
      return

    if imageLinks?
      url = books_.uncurl imageLinks.thumbnail
      data.pictures.push url
      data.pictures.push books_.zoom(url)

    return data

  normalize: (url)->
    # cant use zoom as some picture return an ugly
    # image placeholder instead of a bigger picture
    # url = @zoom(url)
    return @uncurl url

  cleanIsbnData: (isbn)->
    _.typeString isbn

    cleanedIsbn = @normalizeIsbn(isbn)
    if books_.isNormalizedIsbn(cleanedIsbn) then return cleanedIsbn
    else console.error 'isbn got an invalid value', cleanedIsbn
