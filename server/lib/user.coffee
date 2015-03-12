CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'

promises_ = __.require 'lib', 'promises'

relations_ = __.require 'controllers', 'relations/lib/queries'
notifs_ = __.require 'lib', 'notifications'
cache_ = __.require 'lib', 'cache'

gravatar = require 'gravatar'

module.exports = user_ =
  db: __.require('couch', 'base')('users', 'user')
  byId: (id)-> @db.get(id)

  byEmail: (email)->
    @db.viewByKey 'byEmail', email

  byUsername: (username)->
    @db.viewByKey 'byUsername', username.toLowerCase()

  nameIsValid: (username)-> /^\w{1,20}$/.test username

  nameIsAvailable: (username)->
    if @nameIsValid(username)
      _.warn username, 'invalid username'
      return promises_.reject "invalid username: #{username}"

    if @isReservedWord(username)
      _.warn username, 'reserved word'
      return promises_.reject "reserved words cant be usernames: #{username}"

    @byUsername(username)
    .then (docs)->
      if docs.length is 0
        _.success username, 'available'
        return username
      else
        _.warn username, 'not available'
        throw new Error('This username already exists')

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

  newUser: (username, email)->
    user =
      type: 'user'
      username: username
      email: email
      created: Date.now()
      # gravatar params: {d: default, s: size}
      picture: gravatar.url(email, {d: 'mm', s: '200'})
    _.info user, 'new user'
    return @db.post(user).then (user)=> @db.get(user.id)

  createUser: (username, email)->
    @nameIsAvailable(username)
    .then @newUser.bind(@, username, email)

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

  isReservedWord: (username)->
    reservedWords = [
      'api'
      'entity'
      'entities'
      'inventory'
      'inventories'
      'wd'
      'wikidata'
      'isbn'
      'profil'
      'profile'
      'item'
      'items'
      'auth'
      'listings'
      'contacts'
      'contact'
      'user'
      'users'
      'friend'
      'friends'
      'welcome'
    ]
    return username in reservedWords

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
    if value.username? and value.email? and value.created? and value.picture?
      user =
        username: value.username
        email: value.email
        created: value.created
        picture: value.picture
      return user
    else
      throw new Error('missing user data')

  addNotification: (userId, type, data)->
    notifs_.add userId, type, data

  getNotifications: (userId)->
    notifs_.getUserNotifications userId
