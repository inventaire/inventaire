isbn = require '../helpers/isbn'
wikidata = require '../helpers/wikidata'

module.exports =
  search: (req, res, next) ->
    _.logBlue req.query, "Entities:Search"

    if req.query.search?

      if _.log isbn.isISBN(req.query.search), 'isbn?'
        searchByIsbn(req.query, res)

      else
        searchByText(req.query, res)

    else
      _.errorHandler res, 'empty query', 400


searchByIsbn = (query, res)->
  wikidata.getBookEntityByISBN(query.search, isbn.isISBN(query.search), query.language)
  .then (body)->
    if body?
      _.sendJSON res, body
    else
      isbn.getBookDataFromISBN(query.search, query.language)
      .then (body)->
        if body?
          _.sendJSON res, body
        else
          _.sendJSON res, body, 404
      .fail (err)->
        _.logRed err, 'getBookDataFromISBN err'
        _.errorHandler res, err
      .done()


searchByText = (query, res)->
  wikidata.getBookEntities(query)
  .then (body)->
    if body?
      _.sendJSON res, body
    else
      _.sendJSON res, body, 404
  .fail (err)-> _.errorHandler res, err
  .done()