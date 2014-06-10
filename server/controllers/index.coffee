db = require('../db')

module.exports.index = (req, res, next) ->
  res.send 'Hello ' + req.session.email