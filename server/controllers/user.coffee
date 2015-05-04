__ = require('config').root
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'
Promise = require 'bluebird'
Radio = __.require 'lib', 'radio'
error_ = __.require 'lib', 'error/error'


module.exports.getUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  userData = securedData(req.user)
  userId = userData._id

  Promise.all([
    user_.getUserRelations(userId)
    user_.getNotifications(userId)
    transactions_.byUser(userId)
  ])
  .spread (relations, notifications, transactions)->
    userData.relations = relations
    userData.notifications = notifications
    userData.transactions = transactions
    res.json userData

  .catch error_.Handler(res)


module.exports.updateUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true

  {attribute, value} = req.body
  {user} = req

  if user[attribute] is value
    return error_.bundle res, 'already up-to-date', 400

  if attribute in User.attributes.updatable
    unless User.tests[attribute](value)
      return error_.bundle res, "invalid #{attribute}: #{value}", 400

    return updateAttribute(user, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch error_.Handler(res)

  if attribute in User.attributes.concurrencial
    # checks for validity and availability (+ reserve words for username)
    return user_.availability[attribute](value)
    .then updateAttribute.bind(null, user, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch error_.Handler(res)

  error_.bundle res, "forbidden update: #{attribute} - #{value}", 403



updateAttribute = (user, attribute, value)->
  if attribute is 'email' then updater = emailUpdater
  else updater = commonUpdater

  user_.db.update user._id, updater.bind(null, attribute, value)


commonUpdater = (attribute, value, doc)->
  doc[attribute] = value
  return doc

emailUpdater = (attribute, value, doc)->
  doc = archivePreviousEmail(doc)
  doc.email = value
  # returns a user doc
  user_.sendValidationEmail(doc)

archivePreviousEmail = (doc)->
  if doc.validEmail
    doc.previousEmails or= []
    doc.previousEmails.push doc.email
    doc.previousEmails = _.uniq(doc.previousEmails)
    doc.validEmail = false
  return doc


updateConfirmation = (res, doc)->
  _.success doc, 'updateConfirmation'
  res.send('ok')

securedData = (user)-> _.pick user, User.attributes.ownerSafe
