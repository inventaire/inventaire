/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const sanitize = __.require('lib', 'sanitize/sanitize');
const items_ = __.require('controllers', 'items/lib/items');
const error_ = __.require('lib', 'error/error');
const responses_ = __.require('lib', 'responses');

const sanitization = {
  ids: {},
  attribute: {},
  value: {}
};

module.exports = function(req, res, next){
  const reqUserId = req.user._id;

  return sanitize(req, res, sanitization)
  .then(function(params){
    const { ids, attribute, value } = params;
    return items_.bulkUpdate(reqUserId, ids, attribute, value)
    .then(responses_.Ok(res));}).catch(error_.Handler(req, res));
};
