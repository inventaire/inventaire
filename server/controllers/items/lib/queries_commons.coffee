__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

filters =
  # Prevent showing private items in group context to avoid giving the false
  # impresssion that those are visible by other members of the group
  group: (item)-> item.listing isnt 'private'

validFilters = Object.keys filters

validateLimitAndOffset = (query)->
  { limit, offset, filter } = query

  if limit?
    limit = _.parsePositiveInteger limit
    unless limit? and limit > 0
      return error_.rejectInvalid 'limit', limit

  if offset?
    offset = _.parsePositiveInteger offset
    unless offset?
      return error_.rejectInvalid 'offset', offset

    unless limit?
      return error_.rejectMissingQuery 'limit'

  if filter?
    unless filter in validFilters
      return error_.rejectInvalid 'filter', filter

  return promises_.resolve { limit, offset, filter }

module.exports =
  validateQuery: (query, paramName, paramTest)->
    params = query[paramName]

    unless _.isNonEmptyString params
      return error_.rejectMissingQuery paramName

    params = _.uniq params.split('|')

    for param in params
      unless paramTest param
        singularParamName = paramName.replace /s$/, ''
        return error_.rejectInvalid singularParamName, param

    validateLimitAndOffset query
    .then (page)->
      page.params = params
      return page

  validateLimitAndOffset: validateLimitAndOffset

  addUsersData: (reqUserId)-> (page)->
    { items } = page
    if items.length is 0
      page.users = []
      return page

    ownersIds = _.uniq items.map(_.property('owner'))

    user_.getUsersByIds reqUserId, ownersIds
    .then (users)->
      page.users = users
      return page

  ownerIs: (userId)-> (item)-> item.owner is userId

  listingIs: (listing)-> (item)-> item.listing is listing

  Paginate: (page)-> (items)->
    { limit, offset, filter } = page
    items = items.sort byCreationDate
    if filter? then items = items.filter filters[filter]
    total = items.length
    offset ?= 0
    last = offset + limit
    if limit?
      items = items.slice offset, last
      data = { items, total, offset, filter }
      if last < total then data.continue = last
      return data
    else
      return { items, total, offset, filter }

byCreationDate = (a, b)-> b.created - a.created
