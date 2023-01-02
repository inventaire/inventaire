import CONFIG from 'config'
import _ from '#builders/utils'
import { transactionUpdate } from '#lib/emails/debounce_emails'
import { initDebouncedEmailsCrawler } from '#lib/emails/debounced_emails_crawler'
import sendEmail from '#lib/emails/send_email'
import { radio } from '#lib/radio'
import activitySummary from './activity_summary/activity_summary.js'

const { initDelay, disabled } = CONFIG.mailer

export function initEmailServices () {
  initMailer()
  initActivitySummary()
}

const initMailer = () => {
  if (disabled) {
    _.warn('mailer disabled')
  } else {
    _.info('mailer enabled')
    // Loading mailer dependencies slightly later
    // due to its lower priority at startup
    setTimeout(initMailerEventListeners, initDelay)
  }
}

const initMailerEventListeners = () => {
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
  _.info('mailer events listeners ready!')
}

const initActivitySummary = () => {
  if (CONFIG.activitySummary.disabled) {
    _.warn('activity summary disabled')
  } else {
    _.info('activity summary enabled')
    setTimeout(activitySummary, initDelay)
  }
}
