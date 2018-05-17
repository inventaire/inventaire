# shared library between server and client
# to force keep side effects in sync

module.exports = (actions, _)->
  { setItemBusyness, changeOwnerIfOneWay } = actions
  setItemToBusy =  _.partial setItemBusyness, true
  setItemToNotBusy = _.partial setItemBusyness, false

  return sideEffets =
    accepted: setItemToBusy
    declined: _.noop
    confirmed: changeOwnerIfOneWay
    returned: setItemToNotBusy
    cancelled: setItemToNotBusy
