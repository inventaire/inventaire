const __ = require('config').universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')
const tasks_ = require('controllers/tasks/lib/tasks')
const updateRelationScore = require('./lib/relation_score')

module.exports = (req, res) => {
  const { id, attribute, value } = req.body
  _.log(id, 'update task')

  if (!_.isNonEmptyString(id)) {
    return error_.bundleMissingBody(req, res, 'id')
  }

  tasks_.update({
    ids: [ id ],
    attribute,
    newValue: value
  })
  .then(res.json.bind(res))
  .then(() => tasks_.byId(id))
  .then(task => updateRelationScore(task.suspectUri))
  .then(Track(req, [ 'task', 'update' ]))
  .catch(error_.Handler(req, res))
}
