inv = require '../helpers/inventoryDB'
_ = require '../helpers/utils'

module.exports =
  fetch: (req, res, next) ->
    inv.fetchOwnerItems()
    .then (resp)->
      items = resp.rows.map (el)->el.doc
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(items)
    .done()

  post: (req, res, next) ->
    console.log "POST to be implemented!"
    # if inv.isValidItem req.body
    #   inv.postDocumentWithIdToInventoryDB req.body
    #   .then(
    #     res.status('201')
    #     res.end()
    #     )
    # else
    #   res.status('400')
    #   res.end()

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    if inv.isValidItem req.body
      inv.putDocumentToInventoryDB req.body
      .then (body)->
        _.log body, 'body'
        res.status '201'
        res.send JSON.stringify(body)
      .fail inv.errorHandler
      .done()
    else
      res.status '400'
      res.send("400: couldn't add this item")

  get: (req, res, next) ->
    _.log req.params.id, 'GET Item ID'
    inv.getUniqueItem req.params.id
    .then (item)->
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(item)
    .fail inv.errorHandler
    .done()

  del: (req, res, next) ->
    _.log req.params.id, 'DELETE Item ID'
    id = req.params.id
    inv.getItemRev id
    .then inv.deleteUniqueItem
    .then (body)->
      _.log body, 'del then body'
      res.status '200'
      res.setHeader 'Content-Type', 'application/json'
      res.send JSON.stringify(body)
    .fail inv.errorHandler
    .done()
