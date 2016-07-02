__ = require('config').universalPath
_ = __.require('builders', 'utils')
error_ = __.require 'lib', 'error/error'

module.exports =
  get: (req, res, next)->
    { pathname } = req._parsedUrl
    if missedApiRequest(req)
      # the request didnt match previous routes
      err = "GET #{req._parsedUrl.pathname}: api route not found"
      error_.bundle req, res, err, 404
    else if imageHeader(req)
      err = "GET #{pathname}: wrong content-type: #{req.headers.accept}"
      error_.bundle req, res, err, 404
    else
      # the routing will be done on the client side
      res.sendFile './index.html', {root: __.path('client', 'public')}

  api: (req, res)->
    error_.bundle req, res, 'wrong API route or http verb', 400,
      verb: req.method
      url: req._parsedUrl.href

imageHeader = (req)-> /^image/.test req.headers.accept

missedApiRequest = (req)->
  req._parsedUrl.pathname.split('/')[1] is 'api'