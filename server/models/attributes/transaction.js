// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// Keep in sync with client/app/modules/transactions/lib/transactions

// actor: the key on which VerifyRights switches
// see controllers/transactions/update_state.coffee
const states = {
  requested: {
    // current action actor
    actor: 'requester',
    // next actions (the actor(s) may differ from the current one)
    next: [ 'accepted', 'declined', 'cancelled' ]
  },
  accepted: {
    actor: 'owner',
    next: [ 'confirmed', 'cancelled' ]
  },
  declined: {
    actor: 'owner',
    next: []
  },
  confirmed: {
    actor: 'requester',
    next: [ 'returned', 'cancelled' ]
  },
  returned: {
    actor: 'owner',
    next: []
  },
  cancelled: {
    actor: 'both',
    next: []
  }
}

const statesList = Object.keys(states)

const basicNextActions = {
  // current state:
  requested: {
    // key: main user role in this transaction
    // value: possible actions
    owner: 'accept/decline',
    requester: 'waiting:accepted'
  },
  accepted: {
    owner: 'waiting:confirmed',
    requester: 'confirm'
  },
  declined: {
    owner: null,
    requester: null
  },
  confirmed: {
    owner: null,
    requester: null
  },
  cancelled: {
    owner: null,
    requester: null
  }
}

// customizing actions for transactions where the item should be returned
// currently only 'lending'
const nextActionsWithReturn = Object.assign({}, basicNextActions, {
  confirmed: {
    owner: 'returned',
    requester: 'waiting:returned'
  },
  returned: {
    owner: null,
    requester: null
  }
}
)

module.exports = { states, statesList, basicNextActions, nextActionsWithReturn }
