// Keep in sync with client/app/modules/transactions/lib/transactions

// actor: the key on which VerifyRights switches
// see controllers/transactions/update_state.js
export const transactionStates = {
  requested: {
    // Current action actor
    actor: 'requester',
    // Next actions (the actor(s) may differ from the current one)
    next: [ 'accepted', 'declined', 'cancelled' ],
  },
  accepted: {
    actor: 'owner',
    next: [ 'confirmed', 'cancelled' ],
  },
  declined: {
    actor: 'owner',
    next: [],
  },
  confirmed: {
    actor: 'requester',
    next: [ 'returned', 'cancelled' ],
  },
  returned: {
    actor: 'owner',
    next: [],
  },
  cancelled: {
    actor: 'both',
    next: [],
  },
}

export const transactionStatesList = Object.keys(transactionStates)

export const transactionBasicNextActions = {
  // Current state:
  requested: {
    // key: main user role in this transaction
    // value: possible actions
    owner: 'accept/decline',
    requester: 'waiting:accepted',
  },
  accepted: {
    owner: 'waiting:confirmed',
    requester: 'confirm',
  },
  declined: {
    owner: null,
    requester: null,
  },
  confirmed: {
    owner: null,
    requester: null,
  },
  cancelled: {
    owner: null,
    requester: null,
  },
}

// customizing actions for transactions where the item should be returned
// currently only 'lending'
export const transactionNextActionsWithReturn = Object.assign({}, transactionBasicNextActions, {
  confirmed: {
    owner: 'returned',
    requester: 'waiting:returned',
  },
  returned: {
    owner: null,
    requester: null,
  },
})
