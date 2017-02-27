__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

validateLimitAndOffset = (query)->
  { limit, offset } = query

  if limit?
    limit = _.parsePositiveInteger limit
    unless limit? and limit > 0
      return error_.reject 'invalid limit', 400, limit

  if offset?
    offset = _.parsePositiveInteger offset
    unless offset?
      return error_.reject 'invalid offset', 400, offset

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

  addUsersData: (reqUserId)-> (page)->
    { items } = page
    if items.length is 0
      page.users = []
      return page

    ownersIds = _.uniq items.map(_.property('owner'))

    user_.getUsersData reqUserId, ownersIds
    .then (users)->
      page.users = users
      return page

  ownerIs: (userId)-> (item)-> item.owner is userId

  listingIs: (listing)-> (item)-> item.listing is listing

  Paginate: (limit, offset)-> (items)->
    items = items.sort byCreationDate
    total = items.length
    offset ?= 0
    last = offset + limit
    if limit?
      items = items.slice offset, last
      data = { items, total, offset }
      if last < total then data.continue = last
      return data
    else
      return { items, total, offset }

byCreationDate = (a, b)-> b.created - a.created
