module.exports = (_)->
  basicNextActions =
    # current state:
    requested:
      # key: main user role in this transaction
      # value: possible actions
      owner: 'accept/decline'
      requester: 'waiting:accepted'
    accepted:
      owner: 'waiting:confirmed'
      requester: 'confirm'
    declined:
      owner: null
      requester: null
    confirmed:
      owner: null
      requester: null
    cancelled:
      owner: null
      requester: null

  # customizing actions for transactions where the item should be returned
  # currently only 'lending'
  nextActionsWithReturn = _.extend {}, basicNextActions,
    confirmed:
      owner: 'returned'
      requester: 'waiting:returned'
    returned:
      owner: null
      requester: null

  getNextActionsList = (transactionName)->
    if transactionName is 'lending' then nextActionsWithReturn
    else basicNextActions

  findNextActions = (transacData)->
    { name, state, mainUserIsOwner } = transacData
    nextActions = getNextActionsList name, state
    role = if mainUserIsOwner then 'owner' else 'requester'
    return nextActions[state][role]

  isActive = (transacData)-> findNextActions(transacData)?
  isArchived = (transacData)-> not isActive(transacData)

  module.exports = { findNextActions, isActive, isArchived }
