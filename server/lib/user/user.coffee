CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
relations_ = __.require 'controllers', 'relations/lib/queries'
groups_ = __.require 'controllers', 'groups/lib/groups'
notifs_ = __.require 'lib', 'notifications'
cache_ = __.require 'lib', 'cache'
couch_ = __.require 'lib', 'couch'
gravatar = require 'gravatar'
User = __.require 'models', 'user'

db = __.require('couch', 'base')('users', 'user')

token_ = require('./token')(db)
user_ =
  db: db
  byId: db.get.bind(db)

  byEmail: (email)->
    db.viewByKey 'byEmail', email

  findOneByEmail: (email)->
    @byEmail(email)
    .then couch_.firstDoc
    .then (user)->
      if user?.email is email then return user
      else throw new Error "user not found for email: #{email}"

  byUsername: (username)->
    db.viewByKey 'byUsername', username.toLowerCase()

  findOneByUsername: (username)->
    @byUsername(username)
    .then couch_.firstDoc
    .then (user)->
      if user?.username is username then return user
      else throw new Error "user not found for username: #{username}"

  findOneByUsernameOrEmail: (str)->
    if User.tests.email(str) then @findOneByEmail(str)
    else @findOneByUsername(str)

  getSafeUserFromUsername: (username)->
    @byUsername(username)
    .then (docs)=>
      if docs?[0]?
        return @publicUserData(docs[0])
      else return
    .catch (err)->
      _.error err, 'couldnt getUserFromUsername'

  usernameStartBy: (username, options)->
    username = username.toLowerCase()
    params =
      startkey: username
      endkey: username + 'Z'
      include_docs: true
    params.limit = options.limit if options?.limit?
    db.viewCustom 'byUsername', params

  create: (username, email, creationStrategy, language, password)->
    @availability.username(username)
    .then -> User.create(username, email, creationStrategy, language, password)
    .then db.postAndReturn.bind(db)
    # don't log the user doc to avoid having password hash in logs
    # but still return the doc
    .then (user)->
      _.log username, 'user created'
      return user
    .then token_.sendValidationEmail

  findLanguage: (req)->
    accept = req.headers['accept-language']
    language = accept?.split?(',')[0]
    if User.tests.language(language) then language

  getUserId: (req)->
    id = req.user?._id
    if id? then return promises_.resolve(id)
    else error_.reject('req.user._id couldnt be found', 401)

  fetchUsers: (ids)-> db.fetch(ids)

  getUsersPublicData: (ids, format='collection')->
    ids = ids.split?('|') or ids
    user_.fetchUsers(ids)
    .then (usersData)->
      # _.success usersData, 'found users data'

      if usersData?
        # _.success usersData, 'usersData before cleaning'
        cleanedUsersData = usersData.map user_.publicUserData

        if format is 'index'
          data = _.indexBy(cleanedUsersData, '_id')
          # _.log data, 'usersData: index format'
        else
          data = cleanedUsersData
          # _.log data, 'usersData: collection format'

        return data

      else
        _.log "users not found. Ids?: #{ids.join(', ')}"
        return

  publicUserData: (value)->
    _.pick value, User.attributes.public

  # only used by tests so far
  deleteUser: (user)-> db.del user._id, user._rev

  deleteUserByUsername: (username)->
    _.info username, 'deleteUserbyUsername'
    @byUsername(username)
    .then (docs)-> docs[0]
    .then @deleteUser.bind @
    .catch (err)-> _.error err, 'deleteUserbyUsername err'

  getUserRelations: (userId, getDocs)->
    # just proxiing to let this module centralize
    # interactions with the social graph
    relations_.getUserRelations(userId, getDocs)

  getRelationsStatuses: (userId, usersIds)->
    getFriendsAndCoMembers(userId)
    .spread (friendsIds, coGroupMembersIds)->
      friends = _.intersection friendsIds, usersIds
      coGroupMembers = _.intersection coGroupMembersIds, usersIds
      # not looking for remaing users as there is no use to it for now
      return [friends, coGroupMembers]

  areFriends: (userId, otherId)->
    _.types arguments, 'strings...'
    relations_.getStatus(userId, otherId)
    .then (status)->
      if status is 'friends' then return true
      else false

  areFriendsOrGroupCoMembers: (userId, otherId)->
    _.types arguments, 'strings...'
    getFriendsAndCoMembers(userId)
    .spread (friendsIds, coGroupMembersIds)->
      return otherId in friendsIds or otherId in coGroupMembersIds

  cleanUserData: (value)->
    {username, email, created, picture} = value
    unless username? and email? and created? and picture?
      throw new Error('missing user data')

    return user =
      username: username
      email: email
      created: created
      picture: picture

  addNotification: (userId, type, data)->
    notifs_.add userId, type, data

  getNotifications: (userId)->
    notifs_.getUserNotifications userId


# result is to be .spread (friendsIds, coGroupMembersIds)->
getFriendsAndCoMembers = (userId)->
  promises_.all [
    relations_.getUserFriends(userId)
    groups_.findUserGroupsCoMembers(userId)
  ]

user_.availability = require('./availability')(user_)

module.exports = _.extend user_, token_
