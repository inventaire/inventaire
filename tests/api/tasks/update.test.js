// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('should')
const { createHuman } = require('../fixtures/entities')
const { update, checkEntities } = require('../utils/tasks')

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:update', () => {
  it('should update a task', done => {
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => checkEntities(human.uri))
    .then(tasks => {
      const task = tasks[0]
      return update(task._id, 'state', 'dismissed')
      .then(updatedTask => {
        updatedTask[0].ok.should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should throw if invalid task id', done => {
    update('')
    .catch(err => {
      err.body.status_verbose.should.be.a.String()
      done()
    })
    .catch(done)
  })
})
