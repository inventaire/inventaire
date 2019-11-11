// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const parseBbox = __.require('lib', 'parse_bbox')
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const promises_ = __.require('lib', 'promises')

module.exports = function(req, res){
  const { query } = req
  const reqUserId = req.user != null ? req.user._id : undefined
  return parseBbox(query)
  .then(bbox => user_.getUsersAuthorizedData(user_.byPosition(bbox), reqUserId))
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}
