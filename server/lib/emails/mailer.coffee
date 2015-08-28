CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
sendEmail = require './send_email'
debounceEmails = require './debounce_emails'
initDebouncedEmailsCrawler = require './debounced_emails_crawler'

module.exports = ->
  if CONFIG.mailer.disabled
    return _.warn 'mailer disabled'

  _.info 'mailer enabled'

  Radio.on 'validation:email', sendEmail.validationEmail
  Radio.on 'reset:password:email', sendEmail.resetPassword
  Radio.on 'notify:friend:request:accepted', sendEmail.friendAcceptedRequest
  Radio.on 'notify:friendship:request', sendEmail.friendshipRequest

  Radio.on 'group:invite', sendEmail.group.bind(null, 'invite')
  Radio.on 'group:acceptRequest', sendEmail.group.bind(null, 'acceptRequest')


  Radio.on 'received:feedback', sendEmail.feedback

  Radio.on 'send:email:invitations', sendEmail.emailInvitations

  initDebouncedEmailsCrawler()

  Radio.on 'transaction:request', debounceEmails.transactionUpdate
  Radio.on 'transaction:update', debounceEmails.transactionUpdate
  Radio.on 'transaction:message', debounceEmails.transactionUpdate
