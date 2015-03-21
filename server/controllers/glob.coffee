__ = require('config').root
_ = __.require('builders', 'utils')
error_ = __.require 'lib', 'error/error'

module.exports =
  get: (req, res, next)->
    pathname = req._parsedUrl.pathname
    if missedApiRequest(req)
      # the request didnt match previous routes
      err = "GET #{req._parsedUrl.pathname}: api route not found"
      error_.bundle res, err, 404
    else if imageHeader(req)
      err = "GET #{pathname}: wrong content-type: #{req.headers.accept}"
      error_.bundle res, err, 404
    else
      # the routing will be done on the client side
      res.sendFile './index.html', {root: __.path('client', 'public')}


imageHeader = (req)-> /^image/.test req.headers.accept

missedApiRequest = (req)->
  req._parsedUrl.pathname.split('/')[1] is 'api'