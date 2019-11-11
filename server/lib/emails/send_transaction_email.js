/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const user_ = __.require('controllers', 'user/lib/user');
const transactions_ = __.require('controllers', 'transactions/lib/transactions');
const items_ = __.require('controllers', 'items/lib/items');
const snapshot_ = __.require('controllers', 'items/lib/snapshot/snapshot');
const promises_ = __.require('lib', 'promises');
const comments_ = __.require('controllers', 'comments/lib/comments');
const { states } = __.require('models', 'attributes/transaction');

const email_ = require('./email');

module.exports = transactionId => transactions_.byId(transactionId)
.then(emailIsRequired)
.then(fetchData)
.then(sendTailoredEmail);
  // catched in the final promise chain: in send_debounced_email transactionUpdate
  // after all the actions to skip are passed

var emailIsRequired = function(transaction){
  const role = findUserToNotify(transaction);
  if (role != null) {
    // progressively building the email ViewModel
    transaction.role = role;
    return transaction;
  } else {
    throw promises_.skip("sending an email isn't required", transaction);
  }
};

const catchErr = function(err){
  if (err.message === 'email_not_required') { return;
  } else { return _.error(err, 'send_transaction_email err'); }
};

var fetchData = transaction => promises_.all([
  user_.byId(transaction.owner),
  user_.byId(transaction.requester),
  items_.byId(transaction.item).then(snapshot_.addToItem),
  comments_.byTransactionId(transaction._id)
])
.spread(function(owner, requester, item, messages){
  item.title = item.snapshot['entity:title'];
  const image = item.snapshot['entity:image'] || (transaction.snapshot.entity != null ? transaction.snapshot.entity.image : undefined);
  // Overriding transaction document ids by the ids' docs (owner, requester, etc.)
  // for the email ViewModel
  return _.extend(transaction, { owner, requester, item, messages, image });})
.then(buildTimeline)
.then(aliasUsers);
  // .then completeActionsData

var sendTailoredEmail = function(transaction){
  const emailType = findEmailType(transaction);
  return email_.transactions[emailType](transaction);
};

var findUserToNotify = function(transaction){
  const { read } = transaction;
  // assumes that both can't have unread updates
  if (!read.owner) { return 'owner';
  } else if (!read.requester) { return 'requester';
  } else { return null; }
};

const newTransaction = function(transaction){
  const ownerActed = _.some(transaction.actions, ownerIsActor);
  if (ownerActed) { return false; }
  const ownerSentMessage = _.some(transaction.messages, OwnerIsSender(transaction));
  if (ownerSentMessage) { return false;
  } else { return true; }
};

var findEmailType = function(transaction){
  if (transaction.role === 'owner') {
    if (newTransaction(transaction)) { return 'yourItemWasRequested';
    } else { return 'updateOnYourItem'; }
  } else { return 'updateOnItemYouRequested'; }
};

var buildTimeline = function(transaction){
  let { actions, messages } = transaction;
  actions = formatActions(transaction, actions);
  messages = formatMessages(transaction, messages);
  let timeline = _.union(actions, messages);
  timeline = _.sortBy(timeline, ev => ev.created || ev.timestamp);

  return extractTimelineLastSequence(transaction, timeline);
};

// format actions and messages for ViewModels
var formatActions = function(transaction, actions){
  const { owner, requester } = transaction;
  return actions.map(function(action){
    action.user = ownerIsActor(action) ? owner : requester;
    return action;
  });
};

var formatMessages = function(transaction, messages){
  const { owner, requester } = transaction;
  return messages.map(function(message){
    message.user = ownerIsMessager(owner, message) ? owner : requester;
    return message;
  });
};

var extractTimelineLastSequence = function(transaction, timeline){
  const lastSequence = [];
  const lastEvent = timeline.pop();
  lastSequence.push(lastEvent);
  let sameSequence = true;
  while ((timeline.length > 0) && sameSequence) {
    const prevEvent = timeline.pop();
    if (prevEvent.user._id === lastEvent.user._id) {
      lastSequence.unshift(prevEvent);
    } else { sameSequence = false; }
  }

  transaction.timeline = lastSequence;
  return transaction;
};

var aliasUsers = function(transaction){
  const lastEvent = transaction.timeline.slice(-1)[0];
  // deducing main and other user from the last sequence
  // as the user notified (mainUser) is necessarly the one that hasn't acted last
  transaction.other = lastEvent.user;
  transaction.mainUser = findMainUser(transaction);
  return transaction;
};

var findMainUser = function(transaction){
  const { owner, requester, other } = transaction;
  if (owner._id === other._id) { return requester;
  } else { return owner; }
};

var ownerIsActor = action => states[action.action].actor === 'owner';
var OwnerIsSender = transaction => message => message.user === transaction.owner;
var ownerIsMessager = (owner, message) => message.user === owner._id;

const completeActionsData = function(transaction){
  const { timeline, other, mainUser } = transaction;
  transaction.timeline = timeline.map(function(ev){
    if (ev.action != null) {
      // need to be copyied on action to be accessible
      // from inside handlebasr {{#each}} loop
      ev.lang = mainUser.language;
      ev.other = other;
    }
    return ev;
  });
  return transaction;
};
