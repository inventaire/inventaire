CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
sendEmail = require './send_email'

module.exports = ->
  Radio.on 'notify:friend:request:accepted', sendEmail.friendAcceptedRequest
  Radio.on 'notify:friendship:request', sendEmail.friendshipRequest