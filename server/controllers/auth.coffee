user = require '../helpers/user'
_ = require '../helpers/utils'

module.exports.login = (req, resp, next) ->
  # _.logBlue req, 'req'
  _.logRed req.session.toJSON(), "req.session before login"
  # _.logPurple verifyStatus '@verifyStatus'
  user.verifyAssertion(req)
  .then (answer)->
    user.verifyStatus answer, req, resp
  .fail (err)->
    _.logRed  err
  .done()

module.exports.logout = (req, res, next) ->
  console.log "logout"
  req.session = null
  res.clearCookie "email"
  res.redirect "/"