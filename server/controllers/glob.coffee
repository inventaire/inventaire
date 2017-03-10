__ = require('config').universalPath
_ = __.require('builders', 'utils')
error_ = __.require 'lib', 'error/error'
publicFolder = __.path 'client', 'public'

module.exports =
  get: (req, res, next)->
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

  api: (req, res)->
    error_.bundle req, res, 'wrong API route or http verb', 400,
      verb: req.method
      url: req._parsedUrl.href

imageHeader = (req)-> /^image/.test req.headers.accept
