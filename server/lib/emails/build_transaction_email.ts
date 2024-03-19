import { some, sortBy, union } from 'lodash-es'
import comments_ from '#controllers/comments/lib/comments'
import { getItemById } from '#controllers/items/lib/items'
import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'
import { getTransactionById } from '#controllers/transactions/lib/transactions'
import { getUserById, serializeUserData } from '#controllers/user/lib/user'
import { transactionStates } from '#models/attributes/transaction'
import email_ from './email.js'

export default async transactionId => {
  const transaction = await getTransactionById(transactionId)
  const role = findUserToNotify(transaction)
  // If no role needs to be notified, no email needs to be sent
  if (!role) return
  // Progressively building the email ViewModel
  transaction.role = role
  await addAssociatedData(transaction)
  return buildTailoredEmail(transaction)
}

const addAssociatedData = transaction => {
  return Promise.all([
    getUserById(transaction.owner),
    getUserById(transaction.requester),
    getItemById(transaction.item).then(addSnapshotToItem).catch(catchDeleteItems),
    comments_.byTransactionId(transaction._id),
  ])
  .then(([ owner, requester, item, messages ]) => {
    owner = serializeUserData(owner)
    requester = serializeUserData(requester)
    let image
    if (item.snapshot) {
      item.title = item.snapshot['entity:title']
      image = item.snapshot['entity:image']
    } else {
      item.title = transaction.snapshot.entity.title
      image = transaction.snapshot.entity && transaction.snapshot.entity.image
    }
    // Overriding transaction document ids by the ids' docs (owner, requester, etc.)
    // for the email ViewModel
    Object.assign(transaction, { owner, requester, item, messages, image })
    return transaction
  })
  .then(buildTimeline)
  .then(aliasUsers)
}

const buildTailoredEmail = transaction => {
  const emailType = findEmailType(transaction)
  return email_.transactions[emailType](transaction)
}

const findUserToNotify = transaction => {
  const { read } = transaction
  // assumes that both can't have unread updates
  if (!read.owner) {
    return 'owner'
  } else if (!read.requester) {
    return 'requester'
  } else {
    return null
  }
}

const newTransaction = transaction => {
  const ownerActed = some(transaction.actions, ownerIsActor)
  if (ownerActed) return false
  const ownerSentMessage = some(transaction.messages, OwnerIsSender(transaction))
  if (ownerSentMessage) return false
  else return true
}

const findEmailType = transaction => {
  if (transaction.role === 'owner') {
    if (newTransaction(transaction)) {
      return 'yourItemWasRequested'
    } else {
      return 'updateOnYourItem'
    }
  } else {
    return 'updateOnItemYouRequested'
  }
}

const buildTimeline = transaction => {
  let { actions, messages } = transaction
  actions = formatActions(transaction, actions)
  messages = formatMessages(transaction, messages)
  let timeline = union(actions, messages)
  timeline = sortBy(timeline, ev => ev.created || ev.timestamp)

  return extractTimelineLastSequence(transaction, timeline)
}

// format actions and messages for ViewModels
const formatActions = (transaction, actions) => {
  const { owner, requester } = transaction
  return actions.map(action => {
    // Possible keys:
    // - requested_timeline_action
    // - accepted_timeline_action
    // - declined_timeline_action
    // - confirmed_timeline_action
    // - returned_timeline_action
    // - cancelled_timeline_action
    action.actionLabelKey = `${action.action}_timeline_action`
    action.user = ownerIsActor(action) ? owner : requester
    return action
  })
}

const formatMessages = (transaction, messages) => {
  const { owner, requester } = transaction
  return messages.map(message => {
    message.user = ownerIsMessager(owner, message) ? owner : requester
    return message
  })
}

const extractTimelineLastSequence = (transaction, timeline) => {
  const lastSequence = []
  const lastEvent = timeline.pop()
  lastSequence.push(lastEvent)
  let sameSequence = true
  while ((timeline.length > 0) && sameSequence) {
    const prevEvent = timeline.pop()
    if (prevEvent.user._id === lastEvent.user._id) {
      lastSequence.unshift(prevEvent)
    } else {
      sameSequence = false
    }
  }

  transaction.timeline = lastSequence
  return transaction
}

const aliasUsers = transaction => {
  const lastEvent = transaction.timeline.at(-1)
  // deducing main and other user from the last sequence
  // as the user notified (mainUser) is necessarly the one that hasn't acted last
  transaction.other = lastEvent.user
  transaction.mainUser = findMainUser(transaction)
  return transaction
}

const findMainUser = transaction => {
  const { owner, requester, other } = transaction
  if (owner._id === other._id) {
    return requester
  } else {
    return owner
  }
}

const ownerIsActor = action => {
  const actor = action.actor || transactionStates[action.action].actor
  return actor === 'owner'
}
const OwnerIsSender = transaction => message => message.user === transaction.owner
const ownerIsMessager = (owner, message) => message.user === owner._id

const catchDeleteItems = err => {
  if (err.statusCode === 404) return { snapshot: {} }
  else throw err
}
