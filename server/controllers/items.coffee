inv = require '../helpers/inv'
user = require '../helpers/user'

module.exports =
  fetch: (req, res, next) ->
    user.getUserId(req.session.email)
    .then inv.byOwner
    .then (resp)->
      items = resp.rows.map (el)-> el.value
      res.json items
    .fail (err)-> _.errorHandler res, err
    .done()

  put: (req, res, next) ->
    _.log req.params.id, 'Put Item ID'
    user.getUserId(req.session.email)
    .done (userId)->
      item = req.body
      item.owner = userId
      if inv.isValidItem item
        inv.db.put item
        .then (body)-> _.getObjIfSuccess inv.db, body
        .then (body)-> res.json 201, body
        .fail (err)-> _.errorHandler res, err
        .done()
      else
        _.errorHandler res, "couldn't add this item", 400

  get: (req, res, next) ->
    _.log req.params.id, 'GET Item ID'
    inv.db.get req.params.id
    .then (body)-> res.json(body)
    .fail (err)-> _.errorHandler res, err
    .done()

  del: (req, res, next) ->
    _.logBlue req.params, 'del'
    inv.db.delete req.params.id, req.params.rev
    .then (body)-> res.json(body)
    .fail (err)-> _.errorHandler res, err
    .done()

  public: (req, res, next) ->
    _.logBlue req.params, 'public'
    inv.byEntity(req.params.uri)
    .then (resp)->
      items = resp.rows.map (el)-> el.value
      _.logBlue items, 'public items'
      res.json items
    .fail (err)-> _.errorHandler res, err
    .done()