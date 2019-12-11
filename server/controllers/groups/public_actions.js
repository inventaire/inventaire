const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const groups_ = require('./lib/groups')
const parseBbox = __.require('lib', 'parse_bbox')
const searchByText = require('./lib/search_by_text')
const sanitize = __.require('lib', 'sanitize/sanitize')

module.exports = {
  byId: (req, res) => {
    sanitize(req, res, { id: {} })
    .then(params => {
      const { id, reqUserId } = params
      return groups_.getGroupData('byId', [ id ], reqUserId)
    })
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  },

  bySlug: (req, res) => {
    sanitize(req, res, { slug: {} })
    .then(params => {
      const { slug, reqUserId } = params
      return groups_.getGroupData('bySlug', [ slug ], reqUserId)
      .then(responses_.Send(res))
    })
    .catch(error_.Handler(req, res))
  },

  searchByText: (req, res) => {
    sanitize(req, res, { search: {} })
    .then(params => {
      const { search } = params
      return searchByText(search)
      .filter(searchable)
    })
    .then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  searchByPositon: (req, res) => {
    parseBbox(req.query)
    // Can't be chained directy as .filter makes problems when parseBbox throws:
    // "parseBbox(...).then(...).then(...).catch(...).filter is not a function"
    .then(bbox => groups_.byPosition(bbox))
    .filter(searchable)
    .then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  lastGroups: (req, res) => {
    groups_.byCreation()
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

    groups_.getSlug(name, groupId)
    .then(responses_.Wrap(res, 'slug'))
    .catch(error_.Handler(req, res))
  }
}

const searchable = _.property('searchable')
