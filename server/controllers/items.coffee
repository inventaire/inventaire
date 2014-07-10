inv = require '../helpers/inv'
user = require '../helpers/user'

module.exports =
  fetch: (req, res, next) ->
    if user.isLoggedIn(req)
      user.getUsername(req.session.email)
      .then inv.byOwner
      .then (resp)->
        _.logYellow resp, 'resp'
        items = resp.rows.map (el)->el.value
        _.logYellow items, 'items'
        _.sendJSON res, items
      .fail (err)-> _.errorHandler res, err
      .done()
    else
      _.logRed req.session.toJSON(), 'req.session'
      _.errorHandler res, 'no user, not items', 400

  post: (req, res, next) ->
    _.logRed "POST to be implemented!"

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    if user.isLoggedIn(req)
      user.getUsername(req.session.email)
      .done (username)->
        req.body.owner = username
        if inv.isValidItem req.body
          inv.putDocumentToInventoryDB req.body
          .then (body)->
            _.sendJSON res, body, 201
          .fail (err)-> _.errorHandler res, err
          .done()
        else
          _.errorHandler "couldn't add this item", 400

  get: (req, res, next) ->
    _.log req.params.id, 'GET Item ID'
    inv.getUniqueItem req.params.id
    .then (item)->
      _.sendJSON res, item, 200
    .fail (err)-> _.errorHandler res, err
    .done()

  del: (req, res, next) ->
    _.log req.params.id, 'DELETE Item ID'
    id = req.params.id
    inv.getItemRev id
    .then inv.deleteUniqueItem
    .then (body)->
      _.sendJSON res, body
    .fail (err)-> _.errorHandler res, err
    .done()
