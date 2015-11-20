CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
tests = __.require 'models','tests/common-tests'

create = (inviterId, email)->
  tests.pass 'email', email
  return addInviter inviterId, baseDoc(email)

baseDoc = (email)->
  type: 'invited'
  email: email
  inviters: {}

# update function
addInviter = (inviterId, doc)->
  # the doc shouldnt be updated if the inviter already did invited
  # but in the undesired case it happens, keep the first timestamp
  doc.inviters[inviterId] or= _.now()
  return doc

alreadyInvited = (inviterId, doc)-> doc.inviters[inviterId]?


module.exports =
  create: create
  addInviter: addInviter
  alreadyInvited: alreadyInvited
  notAlreadyInvited: _.negate alreadyInvited
