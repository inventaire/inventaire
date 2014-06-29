inv = require '../helpers/inventoryDB'
user = require '../helpers/user'
_ = require '../helpers/utils'

module.exports =
  fetch: (req, res, next) ->
    if req.session.email?
      _.logRed req.session.toJSON()
      inv.fetchUserItems()
      .then (resp)->
        items = resp.rows.map (el)->el.doc
        _.sendJSON res, items
      .done()

    else
      user.redirectToLogin req, res

  post: (req, res, next) ->
    _.logRed "POST to be implemented!"

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    if inv.isValidItem req.body
      inv.putDocumentToInventoryDB req.body
      .then (body)->
        _.sendJSON res, body, 201
      .fail inv.errorHandler
      .done()
    else
      res.status '400'
      res.send("400: couldn't add this item")

  get: (req, res, next) ->
    _.log req.params.id, 'GET Item ID'
    inv.getUniqueItem req.params.id
    .then (item)->
      _.sendJSON res, item, 200
    .fail inv.errorHandler
    .done()

  del: (req, res, next) ->
    _.log req.params.id, 'DELETE Item ID'
    id = req.params.id
    inv.getItemRev id
    .then inv.deleteUniqueItem
    .then (body)->
      _.sendJSON res, body
    .fail inv.errorHandler
    .done()
