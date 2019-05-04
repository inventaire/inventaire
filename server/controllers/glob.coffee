__ = require('config').universalPath
_ = __.require('builders', 'utils')
error_ = __.require 'lib', 'error/error'
publicFolder = __.path 'client', 'public'

module.exports =
  get: (req, res)->
    { pathname } = req._parsedUrl
    domain = pathname.split('/')[1]
    if domain is 'api'
      error_.bundle req, res, "GET #{pathname}: api route not found", 404
    else if domain is 'public'
      error_.bundle req, res, "GET #{pathname}: asset not found", 404
    else if imageHeader(req)
      err = "GET #{pathname}: wrong content-type: #{req.headers.accept}"
      error_.bundle req, res, err, 404
    else
      # the routing will be done on the client side
      res.sendFile './index.html', { root: publicFolder }

  jsonRedirection: (req, res)->
    { pathname } = req._parsedUrl
    [ domain, id ] = pathname.split('/').slice(1)
    id = id?.replace /\.json$/, ''
    redirectionFn = redirections[domain]

    unless redirectionFn?
      return error_.bundleInvalid req, res, 'domain', domain

    res.redirect redirectionFn(id)

  redirectToApiDoc: (req, res)-> res.redirect 'https://api.inventaire.io'

  api: (req, res)->
    error_.bundle req, res, 'wrong API route or http verb', 400,
      verb: req.method
      url: req._parsedUrl.href

imageHeader = (req)-> /^image/.test req.headers.accept

redirections =
  entity: (uri)-> "/api/entities?action=by-uris&uris=#{uri}"
  inventory: (username)-> "/api/users?action=by-usernames&usernames=#{username}"
  users: (id)-> "/api/users?action=by-ids&ids=#{id}"
  groups: (id)->
    if _.isGroupId id then "/api/groups?action=by-id&id=#{id}"
    else "/api/groups?action=by-slug&slug=#{id}"
  items: (id)-> "/api/items?action=by-ids&ids=#{id}"
  # transactions: (id)->
