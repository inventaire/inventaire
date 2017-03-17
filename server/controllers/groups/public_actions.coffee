CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models','tests/common-tests'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
parseBbox = __.require 'lib', 'parse_bbox'

module.exports =
  byId: (req, res)->
    { id } = req.query
    reqUserId = req.user?._id
    unless tests.valid 'groupId', id
      return error_.bundleInvalid req, res, 'id', id

    groups_.getGroupData id, reqUserId
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  searchByName: (req, res)->
    { search } = req.query
    unless _.isNonEmptyString search
      return error_.bundleInvalid req, res, 'search', search

    groups_.nameStartBy search
    .filter searchable
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  searchByPositon: (req, res)->
    parseBbox req.query
    .then (bbox)->
      # can't be chained directy as .filter makes problems when parseBbox throws:
      # "parseBbox(...).then(...).then(...).catch(...).filter is not a function"
      groups_.byPosition bbox
      .filter searchable
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  lastGroups: (req, res)->
    groups_.byCreation()
    .filter searchable
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  slug: (req, res)->
    { name, group:groupId } = req.query

    unless name? then return error_.bundleMissingQuery req, res, 'name'

    if groupId? and not _.isGroupId groupId
      return error_.bundleInvalid req, res, 'group', groupId

    groups_.getSlug name, groupId
    .then _.Wrap(res, 'slug')
    .catch error_.Handler(req, res)

searchable = _.property 'searchable'
