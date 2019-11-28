require('should')
const { createHuman } = require('../fixtures/entities')
const { update } = require('../utils/tasks')
const { createTask } = require('../fixtures/tasks')

describe('tasks:update', () => {
  it('should update a task', done => {
    createHuman()
    .then(suspect => {
      createTask({ suspectUri: suspect.uri })
      .then(task => update(task.id, 'state', 'dismissed'))
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
