import { transactionUpdate } from '#lib/emails/debounce_emails'
import { initDebouncedEmailsCrawler } from '#lib/emails/debounced_emails_crawler'
import sendEmail from '#lib/emails/send_email'
import { radio } from '#lib/radio'
import { warn, info } from '#lib/utils/logs'
import config from '#server/config'
import activitySummary from './activity_summary/activity_summary.js'

const { initDelay, disabled } = config.mailer

export function initEmailServices () {
  initMailer()
  initActivitySummary()
}

function initMailer () {
  if (disabled) {
    warn('mailer disabled')
  } else {
    info('mailer enabled')
    // Loading mailer dependencies slightly later
    // due to its lower priority at startup
    setTimeout(initMailerEventListeners, initDelay)
  }
}

function initMailerEventListeners () {
  radio.on('validation:email', sendEmail.validationEmail)
  radio.on('reset:password:email', sendEmail.resetPassword)
  radio.on('notify:friend:request:accepted', sendEmail.friendAcceptedRequest)
  radio.on('notify:friendship:request', sendEmail.friendshipRequest)

  radio.on('group:invite', sendEmail.group.bind(null, 'invite'))
  radio.on('group:acceptRequest', sendEmail.group.bind(null, 'acceptRequest'))
  radio.on('group:request', sendEmail.groupJoinRequest)

  radio.on('received:feedback', sendEmail.feedback)

  radio.on('send:email:invitations', sendEmail.friendInvitations)
  radio.on('send:group:email:invitations', sendEmail.groupInvitations)

  initDebouncedEmailsCrawler()

  radio.on('transaction:request', transactionUpdate)
  radio.on('transaction:update', transactionUpdate)
  radio.on('transaction:message', transactionUpdate)
  info('mailer events listeners ready!')
}

function initActivitySummary () {
  if (config.activitySummary.disabled) {
    warn('activity summary disabled')
  } else {
    info('activity summary enabled')
    setTimeout(activitySummary, initDelay)
  }
}
