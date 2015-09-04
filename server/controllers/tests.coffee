CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports =
  get: (req, res, next)->
    _.log req.query, 'query'  unless _.objLength(req.query) is 0
    # _.log req.headers, 'headers'
    res.json {server: 'GET OK'}
  post: (req, res, next)->
    _.log req.query, 'query'
    _.log req.headers, 'headers'

    # useful to see text/plain bodys
    if isPlainText(req)
      rawBody req, res, next
    else
      _.log req.body, 'body'
      res.json {server: 'POST OK', body: req.body}

  delete: (req, res, next)->
    _.log req.body, 'body'
    _.log req.query, 'query'
    res.json {server: 'DELETE OK', body: req.body}

isPlainText = (req)->
  req.headers['content-type'] is 'text/plain'

# overpassing the bodyParser middleware
# as it handles json only
# cf http://stackoverflow.com/questions/22143105/node-js-express-express-json-and-express-urlencoded-with-form-submit
rawBody = (req, res, next)->
  body = ''
  req.on 'data', (chunk)-> body += chunk
  req.on 'end', ->
    _.log body, 'body'
    res.send body
