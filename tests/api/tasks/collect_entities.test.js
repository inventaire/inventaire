
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Promise } = __.require('lib', 'promises')
const { createHuman } = require('../fixtures/entities')
const { getBySuspectUri, collectEntities } = require('../utils/tasks')
const { undesiredErr } = __.require('apiTests', 'utils/utils')

// Tests dependency:
// - running after a database reset
// - having a populated ElasticSearch wikidata index
// Disabled to avoid crashing tests when those depdendencies aren't met
describe('tasks:collect-entities', () => xit('should create new tasks', done => {
  Promise.all([
    createHuman({ labels: { en: 'Stanislas Lem' } }),
    createHuman({ labels: { en: 'Stanislas Lem' } })
  ])
  .then(humans => {
    const uris = _.map(humans, 'uri')
    return collectEntities()
    .delay(5000)
    .then(() => Promise.all(uris.map(getBySuspectUri)))
    .map(tasks => tasks.length.should.aboveOrEqual(1))
    .then(() => done())
  })
  .catch(undesiredErr(done))
}))
