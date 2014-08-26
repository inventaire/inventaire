isbn = require '../helpers/isbn'
wikidata = require '../helpers/wikidata'

module.exports =
  search: (req, res, next) ->
    _.logBlue req.query, "Entities:Search"

    if req.query.search?
      wikidata.getBookEntities(req.query)
      .then (body)->
        if body?
          _.sendJSON res, body
        else
          _.sendJSON res, body, 404
      .fail (err)-> _.errorHandler res, err
      .done()

    else
      _.errorHandler res, 'empty query', 400