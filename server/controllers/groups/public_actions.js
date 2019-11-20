/* eslint-disable
    implicit-arrow-linebreak,
*/

// Fix any style issues and re-enable lint.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const groups_ = require('./lib/groups')
const parseBbox = __.require('lib', 'parse_bbox')
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = {
  byId: (req, res) => {
    const { id } = req.query
    const reqUserId = req.user != null ? req.user._id : undefined

    if (!_.isGroupId(id)) {
      return error_.bundleInvalid(req, res, 'id', id)
    }

    return groups_.getGroupData('byId', [ id ], reqUserId)
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  },

  bySlug: (req, res) => {
    const { slug } = req.query
    const reqUserId = req.user != null ? req.user._id : undefined

    if (!_.isNonEmptyString(slug)) {
      return error_.bundleMissingQuery(req, res, 'slug')
    }

    return groups_.getGroupData('bySlug', [ slug ], reqUserId)
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  },

  searchByText: (req, res) => {
    const { query } = req
    const search = query.search != null ? query.search.trim() : undefined

    if (!_.isNonEmptyString(search)) {
      return error_.bundleInvalid(req, res, 'search', search)
    }

    return searchByText(search)
    .filter(searchable)
    .then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  searchByPositon: (req, res) => {
    return parseBbox(req.query)
    .then(bbox => // can't be chained directy as .filter makes problems when parseBbox throws:
    // "parseBbox(...).then(...).then(...).catch(...).filter is not a function"
      groups_.byPosition(bbox)
    .filter(searchable)).then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  lastGroups: (req, res) => {
    return groups_.byCreation()
    .filter(searchable)
    .then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  slug: (req, res) => {
    const { name, group: groupId } = req.query

    if (name == null) return error_.bundleMissingQuery(req, res, 'name')

    if ((groupId != null) && !_.isGroupId(groupId)) {
      return error_.bundleInvalid(req, res, 'group', groupId)
    }

    return groups_.getSlug(name, groupId)
    .then(responses_.Wrap(res, 'slug'))
    .catch(error_.Handler(req, res))
  }
}

const searchByText = buildSearcher({
  dbBaseName: 'groups',
  queryBodyBuilder: search => {
    const should = [
      // Name
      { match: { name: { query: search, boost: 5 } } },
      { match_phrase_prefix: { name: { query: search, boost: 4 } } },
      { fuzzy: { name: search } },
      // Description
      { match: { description: search } }
    ]

    return { query: { bool: { should } } }
  }
})

const searchable = _.property('searchable')
