CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

module.exports = ->
  if CONFIG.mailer.disabled
    return _.warn 'mailer disabled'

  _.info 'mailer enabled'

  # loading mailer dependencies slightly later
  # due to its lower priority at startup
  setTimeout initMailerEventListeners, 3000

initMailerEventListeners = ->
  Radio = __.require 'lib', 'radio'
  sendEmail = require './send_email'
  debounceEmails = require './debounce_emails'
  initDebouncedEmailsCrawler = require './debounced_emails_crawler'

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
  _.info 'mailer events listeners ready!'
