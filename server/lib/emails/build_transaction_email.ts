import { some, union } from 'lodash-es'
import comments_ from '#controllers/comments/lib/comments'
import { getItemById } from '#controllers/items/lib/items'
import { addItemSnapshot } from '#controllers/items/lib/snapshot/snapshot'
import { getTransactionById } from '#controllers/transactions/lib/transactions'
import { getUserById, serializeUserData } from '#controllers/user/lib/user'
import { transactionStates } from '#models/attributes/transaction'
import type { TransactionComment } from '#types/comment'
import type { EntityImg } from '#types/entity'
import type { SerializedItem } from '#types/item'
import type { Transaction, TransactionAction, TransactionId, TransactionUserRole } from '#types/transaction'
import type { User } from '#types/user'
import email_ from './email.js'
import type { EmptyObject, OverrideProperties } from 'type-fest'

type ItemPlaceholder = { snapshot?: EmptyObject }

type CommentWithUser = OverrideProperties<TransactionComment, { user: User }>
type TransactionActionWithUser = TransactionAction & { user: User }
type TransactionEventWithUser = CommentWithUser | TransactionActionWithUser
type TimelineWithUsers = TransactionEventWithUser[]

export interface TransactionEmailViewModel {
  transaction: Transaction
  role: TransactionUserRole
  owner: User
  requester: User
  other: User
  mainUser: User
  item: SerializedItem | ItemPlaceholder
  itemTitle: string
  messages: TransactionComment[]
  image?: EntityImg
  timeline: TimelineWithUsers
}

export default async function (transactionId: TransactionId) {
  const transaction = await getTransactionById(transactionId)
  const role = findUserToNotify(transaction)
  // If no role needs to be notified, no email needs to be sent
  if (!role) return
  let [ owner, requester, item, messages ] = await Promise.all([
    getUserById(transaction.owner),
    getUserById(transaction.requester),
    getItemById(transaction.item).then(addItemSnapshot).catch(catchDeleteItems),
    comments_.byTransactionId(transaction._id),
  ])
  owner = serializeUserData(owner)
  requester = serializeUserData(requester)
  const itemTitle = item.snapshot?.['entity:title'] || transaction.snapshot?.entity.title
  const image = item.snapshot?.['entity:image'] || transaction.snapshot?.entity.image
  // Overriding transaction document ids by the ids' docs (owner, requester, etc.)
  // for the email ViewModel
  const timeline: TimelineWithUsers = getTimelineWithUsers(transaction, messages, owner, requester)
  const timelineLastSequence: TimelineWithUsers = extractTimelineLastSequence(timeline)
  const { other, mainUser } = aliasUsers(timelineLastSequence, owner, requester)
  const transactionEmailViewModel: TransactionEmailViewModel = {
    transaction,
    role,
    owner,
    requester,
    item,
    itemTitle,
    messages,
    image,
    timeline: timelineLastSequence,
    other,
    mainUser,
  }
  return buildTailoredEmail(transactionEmailViewModel)
}

function buildTailoredEmail (transactionEmailViewModel) {
  const emailType = findEmailType(transactionEmailViewModel)
  return email_.transactions[emailType](transactionEmailViewModel)
}

function findUserToNotify (transaction: Transaction) {
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

function isNewTransaction (transaction: Transaction, messages: TransactionComment[]) {
  const ownerActed = some(transaction.actions, ownerIsActor)
  if (ownerActed) return false
  const ownerSentMessage = some(messages, OwnerIsSender(transaction))
  if (ownerSentMessage) return false
  else return true
}

function findEmailType (transactionEmailViewModel) {
  const { role, transaction, messages } = transactionEmailViewModel
  if (role === 'owner') {
    if (isNewTransaction(transaction, messages)) {
      return 'yourItemWasRequested'
    } else {
      return 'updateOnYourItem'
    }
  } else {
    return 'updateOnItemYouRequested'
  }
}

function getTimelineWithUsers (transaction: Transaction, messages: TransactionComment[], owner: User, requester: User) {
  const actions = getActionsWithUsers(transaction, owner, requester)
  const messagesWithUsers = getMessagesWithUsers(messages, owner, requester)
  const timeline: TimelineWithUsers = union(actions, messagesWithUsers)
  const sortedTimeline: TimelineWithUsers = timeline.sort((a, b) => getTimelineEventTimestamp(a) - getTimelineEventTimestamp(b))
  return sortedTimeline
}

function getTimelineEventTimestamp (event: TransactionEventWithUser) {
  return 'created' in event ? event.created : event.timestamp
}

// format actions and messages for ViewModels
function getActionsWithUsers (transaction, owner: User, requester: User) {
  const { actions } = transaction
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

function getMessagesWithUsers (messages: TransactionComment[], owner: User, requester: User) {
  return messages.map(message => {
    return {
      ...message,
      user: ownerIsMessager(owner, message) ? owner : requester,
    }
  })
}

function extractTimelineLastSequence (timeline: TimelineWithUsers) {
  const lastSequence = []
  let lastEvent
  let sameSequence = true
  while ((timeline.length > 0) && sameSequence) {
    const prevEvent = timeline.pop()
    lastEvent ??= prevEvent
    if (prevEvent.user._id === lastEvent.user._id) {
      lastSequence.unshift(prevEvent)
    } else {
      sameSequence = false
    }
  }

  return lastSequence
}

function aliasUsers (timeline: TimelineWithUsers, owner: User, requester: User) {
  const lastEvent = timeline.at(-1)
  // deducing main and other user from the last sequence
  // as the user notified (mainUser) is necessarly the one that hasn't acted last
  return {
    other: lastEvent.user,
    mainUser: findMainUser(lastEvent.user, owner, requester),
  }
}

function findMainUser (other: User, owner: User, requester: User) {
  if (owner._id === other._id) {
    return requester
  } else {
    return owner
  }
}

function ownerIsActor (action) {
  const actor = action.actor || transactionStates[action.action].actor
  return actor === 'owner'
}
const OwnerIsSender = transaction => message => message.user === transaction.owner
const ownerIsMessager = (owner, message) => message.user === owner._id

function catchDeleteItems (err) {
  if (err.statusCode === 404) {
    const itemPlaceholder: ItemPlaceholder = { snapshot: {} }
    return itemPlaceholder
  } else {
    throw err
  }
}
