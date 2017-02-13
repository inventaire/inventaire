__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'

module.exports =
  addUsersData: (items)->
    ownersIds = _.uniq _.flatten(_.values(items)).map(_.property('owner'))
    user_.getUsersPublicData ownersIds
    .then (users)-> { users, items }
