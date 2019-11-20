
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const { createHuman } = require('./entities')
const { checkEntities } = require('../utils/tasks')

const promises = {}

module.exports = {
  createSomeTasks: humanLabel => {
    if (promises[humanLabel] != null) return promises[humanLabel]

    const human = { labels: { en: humanLabel } }

    promises[humanLabel] = Promise.all([ createHuman(human), createHuman(human) ])
      .then(humans => {
        return checkEntities(_.map(humans, 'uri'))
        .then(tasks => ({ tasks, humans }))
      })

    return promises[humanLabel]
  }
}
