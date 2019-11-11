/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const groups_ = require('./lib/groups')
const { Track } = __.require('lib', 'track')

module.exports = function(req, res){
  let { name, searchable, description, position } = req.body
  if (name == null) return error_.bundleMissingBody(req, res, 'name')

  if (searchable == null) { searchable = true }

  return groups_.create({
    name,
    description: description || '',
    searchable,
    position: position || null,
    creatorId: req.user._id }).then(responses_.Send(res))
  .then(Track(req, [ 'groups', 'create' ]))
  .catch(error_.Handler(req, res))
}
