__ = require('config').root
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'
groups_ = __.require 'controllers', 'groups/lib/groups'
Promise = require 'bluebird'
Radio = __.require 'lib', 'radio'
error_ = __.require 'lib', 'error/error'


module.exports.getUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  userData = securedData req.user
  userId = userData._id

  getUserData userId
  .spread AttachUserData(userData)
  .then res.json.bind(res)
  .catch error_.Handler(res)

getUserData = (userId)->
  Promise.all([
    user_.getUserRelations(userId)
    user_.getNotifications(userId)
    transactions_.byUser(userId)
    groups_.allUserGroups(userId)
  ])

AttachUserData = (userData)->
  attach = (relations, notifications, transactions, groups)->
    _.extend userData,
      relations: relations
      notifications: notifications
      transactions: transactions
      groups: groups


module.exports.updateUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true

  {attribute, value} = req.body
  {user} = req

  # support deep objects
  if _.get(user, attribute) is value
    return error_.bundle res, 'already up-to-date', 400

  rootAttribute = attribute.split('.')[0]

  if rootAttribute in User.attributes.updatable
    unless _.get(User.tests, attribute)(value)
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
  updater = switch attribute
    when 'email' then emailUpdater
    when 'settings.notifications.global' then stringBooleanUpdater
    else commonUpdater
  user_.db.update user._id, updater.bind(null, attribute, value)

commonUpdater = (attribute, value, doc)->
  return _.set doc, attribute, value

stringBooleanUpdater = (attribute, value, doc)->
  value = if value is 'true' then true else false
  return commonUpdater attribute, value, doc

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
