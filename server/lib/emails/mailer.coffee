CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
sendEmail = require './send_email'

module.exports = ->
  unless CONFIG.mailer.disabled
    _.info 'mailer enabled'
    Radio.on 'notify:friend:request:accepted', sendEmail.friendAcceptedRequest
    Radio.on 'notify:friendship:request', sendEmail.friendshipRequest