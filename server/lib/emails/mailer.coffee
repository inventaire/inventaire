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
  radio = __.require 'lib', 'radio'
  sendEmail = require './send_email'
  debounceEmails = require './debounce_emails'
  initDebouncedEmailsCrawler = require './debounced_emails_crawler'

  radio.on 'validation:email', sendEmail.validationEmail
  radio.on 'reset:password:email', sendEmail.resetPassword
  radio.on 'notify:friend:request:accepted', sendEmail.friendAcceptedRequest
  radio.on 'notify:friendship:request', sendEmail.friendshipRequest

  radio.on 'group:invite', sendEmail.group.bind(null, 'invite')
  radio.on 'group:acceptRequest', sendEmail.group.bind(null, 'acceptRequest')


  radio.on 'received:feedback', sendEmail.feedback

  radio.on 'send:email:invitations', sendEmail.emailInvitations

  initDebouncedEmailsCrawler()

  radio.on 'transaction:request', debounceEmails.transactionUpdate
  radio.on 'transaction:update', debounceEmails.transactionUpdate
  radio.on 'transaction:message', debounceEmails.transactionUpdate
  _.info 'mailer events listeners ready!'

initActivitySummary = ->
  if CONFIG.activitySummary.disabled
    return _.warn 'activity summary disabled'

  _.info 'activity summary enabled'
  activitySummary = require './activity_summary/activity_summary'
  delayedInit activitySummary, initDelay
