CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

promises_ = __.require 'lib', 'promises'
relations_ = __.require 'controllers', 'relations/lib/queries'
notifs_ = __.require 'lib', 'notifications'
cache_ = __.require 'lib', 'cache'
gravatar = require 'gravatar'
User = __.require 'models', 'user'

isReservedWord = require './is_reserved_word'

module.exports = user_ =
  db: __.require('couch', 'base')('users', 'user')
  byId: (id)-> @db.get(id)

  byEmail: (email)->
    @db.viewByKey 'byEmail', email

  byUsername: (username)->
    @db.viewByKey 'byUsername', username.toLowerCase()

  findOneByUsername: (username)->
    @byUsername(username)
    .then (users)->
      user = users[0]
      if user?.username is username then return user
      else throw new Error "user not found for username: #{username}"

  nameIsAvailable: (username)->
    unless User.validUsername(username)
      _.warn username, 'invalid username'
      return promises_.reject "invalid username: #{username}"

    if isReservedWord(username)
      _.warn username, 'reserved word'
      return promises_.reject "reserved words cant be usernames: #{username}"

    @byUsername(username)
    .then checkAvailability.bind(null, username, 'username')

  emailIsAvailable: (email)->
    unless User.validEmail(email)
      _.warn email, 'invalid email'
      return promises_.reject "invalid email: #{email}"

    @byEmail(email)
    .then checkAvailability.bind(null, email, 'email')

  getSafeUserFromUsername: (username)->
    @byUsername(username)
    .then (docs)=>
      if docs?[0]?
        return @safeUserData(docs[0])
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
    @db.viewCustom 'byUsername', params

  create: (username, email, creationStrategy, password)->
    @nameIsAvailable(username)
    .then -> User.create(username, email, creationStrategy, password)
    .then @db.post.bind(@db)
    .then _.Log('user created')
    .then (user)-> user.id
    .then @byId.bind(@)

  getUserId: (req)->
    id = req.user?._id
    if id? then return promises_.resolve(id)
    else promises_.reject('req.user._id couldnt be found')

  fetchUsers: (ids)-> @db.fetch(ids)

  getUsersPublicData: (ids, format='collection')->
    ids = ids.split?('|') or ids
    @fetchUsers(ids)
    .then (usersData)=>
      # _.success usersData, 'found users data'

      if usersData?
        # _.success usersData, 'usersData before cleaning'
        cleanedUsersData = usersData.map @safeUserData

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

  safeUserData: (value)->
    _id: value._id
    username: value.username
    created: value.created
    picture: value.picture

  # only used by tests so far
  deleteUser: (user)-> @db.del user._id, user._rev

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
    friends = []
    others = []
    relations_.getUserFriends(userId)
    .then (friendsIds)->
      usersIds.forEach (id)->
        if id in friendsIds
          friends.push id
        else others.push id
      return [friends, others]

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

checkAvailability = (value, label, docs)->
  if docs.length is 0
    _.success value, 'available'
    return value
  else
    err = new Error("This #{label} is already used")
    _.warn value, err.type = 'not_available'
    throw err