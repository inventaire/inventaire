__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports =
  validateQuery: (query, paramName, paramTest)->
    params = query[paramName]

    unless _.isNonEmptyString params
      return error_.reject "missing #{paramName}", 400, query

    params = _.uniq params.split('|')

    for param in params
      unless paramTest param
        singularParamName = paramName.replace /s$/, ''
        return error_.reject "invalid #{singularParamName}", 400, param

    return promises_.resolve params

  addUsersData: (items)->
    allItems = _.flatten _.values(items)
    if allItems.length is 0 then return { users: [], items }

    ownersIds = _.uniq allItems.map(_.property('owner'))

    user_.getUsersPublicData ownersIds
    .then (users)-> { users, items }

  ownerIs: (userId)-> (item)-> item.owner is userId
  listingIs: (listing)-> (item)-> item.listing is listing
