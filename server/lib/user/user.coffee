CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

couch_ = require 'inv-couch'
User = __.require 'models', 'user'
{ byEmail, byEmails } = require './shared_user_handlers'
{ publicUserData, publicUsersDataWithEmails } = require './public_user_data'

db = __.require('couch', 'base')('users', 'user')

user_ =
  db: db
  byId: db.get.bind(db)
  byIds: db.fetch.bind(db)
  byEmail: byEmail.bind(null, db)

  findOneByEmail: (email)->
    user_.byEmail email
    .then couch_.firstDoc
    .then (user)->
      if user?.email is email then return user
      else throw new Error "user not found for email: #{email}"

  byEmails: byEmails.bind(null, db)

  publicUsersDataByEmails: (emails)->
    _.type emails, 'array'
    user_.byEmails emails
    # keeping the email is required to map the users returned
    # with the initial input
    .then publicUsersDataWithEmails

  byUsername: (username)->
    db.viewByKey 'byUsername', username.toLowerCase()

  findOneByUsername: (username)->
    user_.byUsername username
    .then couch_.firstDoc
    .then (user)->
      # ignoring case as expected does the database
      if user?.username.toLowerCase() is username.toLowerCase() then return user
      else throw new Error "user not found for username: #{username}"

  findOneByUsernameOrEmail: (str)->
    if User.tests.email(str) then user_.findOneByEmail str
    else user_.findOneByUsername(str)

  getSafeUserFromUsername: (username)->
    user_.byUsername username
    .then (docs)->
      if docs?[0]? then return publicUserData docs[0]
      else return

  usernameStartBy: (username, options)->
    username = username.toLowerCase()
    params =
      startkey: username
      endkey: username + 'Z'
      include_docs: true
    params.limit = options.limit if options?.limit?
    db.viewCustom 'byUsername', params

  getUsersPublicData: (ids, format='collection')->
    ids = ids.split?('|') or ids
    user_.byIds ids
    .then (usersData)->
      unless usersData?
        _.warn ids, "users not found"
        return

      cleanedUsersData = usersData.map publicUserData
      if format is 'index' then return _.indexBy cleanedUsersData, '_id'
      else return cleanedUsersData


token_ = require('./token')(db, user_)
user_.availability = availability_ = require('./availability')(user_)
user_.create = require('./create')(db, token_, availability_)
user_.byPosition = require('./by_position')(db)

# only used by tests so far
user_.deleteByUsername = require('./delete_by_username')(db, user_)

reqParsers = require './req_parsers'
relationsStatus = require './relations_status'

module.exports = _.extend user_, token_, relationsStatus, reqParsers
