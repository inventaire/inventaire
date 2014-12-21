_ = require('config').root.require('builders', 'utils')

module.exports =
  get: (req, res, next)->
    if /text\/html/.test req.headers.accept
      # the routing will be done on the client side
      res.sendfile './index.html', {root: publicRoot}
    else
      err = "wrong content-type: #{req.headers.accept}"
      _.warn req, 'req'
      _.errorHandler res, err, 404

publicRoot = __dirname + '/../../client/public'