__ = require('config').root
_ = __.require('builders', 'utils')

module.exports =
  get: (req, res, next)->
    if missedApiRequest(req)
      err = "api route not found: #{req._parsedUrl.pathname}"
      _.errorHandler res, err, 404
    else if imageHeader(req)
      err = "wrong content-type: #{req.headers.accept}"
      _.errorHandler res, err, 404
    else
      # the routing will be done on the client side
      res.sendfile './index.html', {root: __.path('client', 'public')}


imageHeader = (req)-> /^image/.test req.headers.accept

missedApiRequest = (req)->
  req._parsedUrl.pathname.split('/')[1] is 'api'