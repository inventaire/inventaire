CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
delayedInit = setTimeout
{ initDelay, disabled } = CONFIG.mailer

module.exports = ->
  initMailer()
  initActivitySummary()

initMailer = ->
  if disabled then return _.warn 'mailer disabled'

  _.info 'mailer enabled'

  # loading mailer dependencies slightly later
  # due to its lower priority at startup
  delayedInit initMailerEventListeners, initDelay

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

initActivitySummary = ->
  if CONFIG.activitySummary.disabled
    return _.warn 'activity summary disabled'

  _.info 'activity summary enabled'
  activitySummary = require './activity_summary/activity_summary'
  delayedInit activitySummary, initDelay
