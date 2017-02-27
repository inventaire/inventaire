__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

validateLimitAndOffset = (query)->
  { limit, offset } = query

  if limit?
    limit = _.parsePositiveInteger limit
    unless limit? then return error_.reject 'invalid limit', 400, limit

  if offset?
    offset = _.parsePositiveInteger offset
    unless offset? then return error_.reject 'invalid offset', 400, offset

    unless limit?
      return error_.reject 'missing a limit parameter', 400, offset

  return promises_.resolve [ limit, offset ]

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

    validateLimitAndOffset query
    .spread (limit, offset)-> [ limit, offset, params ]

  validateLimitAndOffset: validateLimitAndOffset

  addUsersData: (reqUserId)-> (items)->
    if items.length is 0 then return { users: [], items }

    ownersIds = _.uniq items.map(_.property('owner'))

    user_.getUsersData reqUserId, ownersIds
    .then (users)-> { users, items }

  ownerIs: (userId)-> (item)-> item.owner is userId

  listingIs: (listing)-> (item)-> item.listing is listing

  Paginate: (limit, offset)-> (items)->
    items = items.sort byCreationDate
    if limit?
      offset ?= 0
      return items.slice offset, offset+limit
    else
      return items

byCreationDate = (a, b)-> b.created - a.created
