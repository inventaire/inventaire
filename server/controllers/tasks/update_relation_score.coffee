__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'

tasks_ = require './lib/tasks'
{ updateRelationScore } = require './lib/relation_score'

module.exports = (req, res)->

  { id } = req.query

  tasks_.byId(id)
  .then (task)-> updateRelationScore(task)
  .then res.json.bind(res)
  .tap Track(req, ['task', 'update relation score'])
  .catch error_.Handler(req, res)
