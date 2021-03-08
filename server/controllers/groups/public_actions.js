const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const groups_ = require('./lib/groups')
const getGroupPublicData = require('./lib/group_public_data')
const sanitize = require('lib/sanitize/sanitize')
const { get: getSlug } = require('./lib/slug')

module.exports = {
  byId: (req, res) => {
    sanitize(req, res, { id: {} })
    .then(params => {
      const { id, reqUserId } = params
      return getGroupPublicData('byId', [ id ], reqUserId)
    })
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  },

  bySlug: (req, res) => {
    sanitize(req, res, { slug: {} })
    .then(params => {
      const { slug, reqUserId } = params
      return getGroupPublicData('bySlug', [ slug ], reqUserId)
      .then(responses_.Send(res))
    })
    .catch(error_.Handler(req, res))
  },

  searchByPositon: (req, res) => {
    sanitize(req, res, { bbox: {} })
    .then(({ bbox }) => groups_.byPosition(bbox))
    .then(groups => groups.filter(searchable))
    .then(responses_.Wrap(res, 'groups'))
    .catch(error_.Handler(req, res))
  },

  slug: (req, res) => {
    const { name, group: groupId } = req.query

    if (name == null) return error_.bundleMissingQuery(req, res, 'name')

    if ((groupId != null) && !_.isGroupId(groupId)) {
      return error_.bundleInvalid(req, res, 'group', groupId)
    }

    getSlug(name, groupId)
    .then(responses_.Wrap(res, 'slug'))
    .catch(error_.Handler(req, res))
  }
}

const searchable = _.property('searchable')
