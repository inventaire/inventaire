__ = require('config').root
_ = __.require 'builders', 'utils'
books = __.require 'lib', 'books'
wikidata = __.require 'lib', 'wikidata'
promises_ = __.require 'lib', 'promises'
cache_ = __.require 'lib', 'cache'

module.exports =
  actions: (req, res, next) ->
    action = req.query.action
    unless action? then return _.errorHandler res, 'bad query', 400

    switch action
      when 'search' then return searchEntity(req, res)
      when 'getimages' then return getImages(req, res)
      else _.errorHandler res, 'entities action not found', 400


searchEntity = (req, res)->
    _.info req.query, "Entities:Search"
    unless req.query.search? and req.query.language?
      err = 'empty query or no language specified'
      return _.errorHandler res, err, 400

    if books.isIsbn(req.query.search)
      _.log req.query.search, 'searchByIsbn'
      searchByIsbn(req.query, res)

    else
      _.log req.query.search, 'searchByText'
      searchByText(req.query, res)


searchByIsbn = (query, res)->
  isbn = query.search
  isbnType = books.isIsbn(isbn)

  promises = [
    wikidata.getBookEntityByIsbn(isbn, isbnType, query.language)
    .catch (err)-> _.error err, 'wikidata getBookEntityByISBN err'

    booksPromise = books.getGoogleBooksDataFromIsbn(isbn)
    .then((res)-> {items:[res], source: 'google'})
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  spreadRequests(res, promises, 'searchByIsbn')

searchByText = (query, res)->

  promises = [
    wikidata.getBookEntities(query)
    .then (items)-> {items: items, source: 'wd', search: query.search}
    .catch (err)-> _.error err, 'wikidata getBookEntities err'

    books.getGoogleBooksDataFromText(query.search)
    .then (res)-> {items: res, source: 'google', search: query.search}
    .catch (err)-> _.error err, 'getGoogleBooksDataFromIsbn err'
  ]

  # adding a 4 seconds timeout on requests
  promises = promises.map (promise)-> promise.timeout 10000

  spreadRequests(res, promises, 'searchByText')


spreadRequests = (res, promises, label)->
  promises_.settle(promises).spread(selectFirstNonEmptyResult)
  .then (selected)->
    if selected?
      res.json selected
    else res.json 404, 'not found'

  .catch (err)->
    _.error err, "#{label} err"
    _.errorHandler res, err

selectFirstNonEmptyResult = (results...)->
  _.info results, "api results"
  selected = null
  results.forEach (result)->
    if result.items?.length > 0 and not selected?
      selected = result
  selected?.source.logIt('selected source')
  return selected


getImages = (req, res)->
  dataArray = req.query.data.split '|'
  # unless _.isArray(dataArray) then return dataArray = [dataArray]
  unless dataArray? then return res.json 400, 'bad query'

  promises = dataArray.map getImage

  _.log dataArray, 'dataArray'
  promises_.settle(promises)
  .then (dataSets)->

    _.log dataSets, 'dataSets'
    data = {}
    i = 0
    while i < dataArray.length
      key = dataArray[i]
      value = dataSets[i]
      data[key] = value
      i++

    _.log data, 'data at getImages'
    res.json data
  .catch (err)-> _.errorHandler res, err

getImage = (data)->
  key = "image:#{data}"
  cache_.get key, books.getImage, books, [data]
  .catch (err)-> _.error err, 'getImage err'