const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { merge, revertMerge } = require('../utils/entities')
const { Wait } = __.require('lib', 'promises')
const { createHuman } = require('../fixtures/entities')
const { deleteByUris: deleteEntityByUris } = require('../utils/entities')
const { createTask } = require('../fixtures/tasks')
const { getByIds, getBySuspectUri, update, checkEntities } = require('../utils/tasks')
const { wait } = __.require('lib', 'promises')

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:hooks', () => {
  describe('entity merge', () => {
    it('should update same suspect tasks to merged state', done => {
      // Alexander Kennedy is expected to have several merge suggestions
      createHuman({ labels: { en: 'Alexander Kennedy' } })
      .then(human => checkEntities(human.uri))
      .then(tasks => {
        const task = tasks[0]
        const anotherTask = tasks[1]
        return merge(task.suspectUri, task.suggestionUri)
        .then(Wait(100))
        .then(() => getByIds(anotherTask._id))
        .then(tasks => {
          const updatedTask = tasks[0]
          updatedTask.state.should.equal('merged')
          done()
        })
      })
      .catch(done)
    })

    it('should update task state to merged', done => {
      Promise.all([ createHuman(), createHuman() ])
      .then(([ suspect, suggestion ]) => {
        const taskParams = {
          suspectUri: suspect.uri,
          suggestionUri: suggestion.uri
        }
        createTask(taskParams)
        .then(task => {
          merge(suspect.uri, suggestion.uri)
          .then(Wait(100))
          .then(() => getByIds(task.id))
          .then(tasks => {
            const updatedTask = tasks[0]
            updatedTask.state.should.equal('merged')
            done()
          })
        })
        .catch(done)
      })
    })
  })

  describe('task update', () => {
    it('should update relationScore of tasks with same suspect', done => {
      // John Smith is expected to have several merge suggestions
      createHuman({ labels: { en: 'John Smith' } })
      .then(human => checkEntities(human.uri))
      .then(tasks => {
        const taskToUpdate = tasks[0]
        const otherTask = tasks[1]
        const { relationScore: taskRelationScore } = taskToUpdate
        return update(taskToUpdate._id, 'state', 'dismissed')
        .then(Wait(100))
        .then(() => getByIds(otherTask._id))
        .then(tasks => {
          const updatedTask = tasks[0]
          updatedTask.relationScore.should.not.equal(taskRelationScore)
          done()
        })
      })
      .catch(done)
    })
  })

  describe('entity merge revert', () => {
    it('should revert task state', async () => {
      const { uri } = await createHuman({ labels: { en: 'Fred Vargas' } })
      const [ task ] = await checkEntities(uri)
      await merge(task.suspectUri, task.suggestionUri)
      await wait(500)
      const [ refreshedTask ] = await getByIds(task._id)
      refreshedTask.state.should.equal('merged')
      await revertMerge(refreshedTask.suspectUri)
      await wait(100)
      const [ rerefreshedTask ] = await getByIds(task._id)
      should(rerefreshedTask.state).not.be.ok()
    })
  })

  describe('entity removed', () => {
    it('should update tasks to merged state when the entity is deleted', done => {
      createHuman()
      .then(suspect => {
        createTask({ suspectUri: suspect.uri })
        .then(task => deleteEntityByUris(suspect.uri))
        .then(() => getBySuspectUri(suspect.uri))
        .then(tasks => {
          tasks.length.should.equal(0)
          done()
        })
      })
      .catch(done)
    })
  })
})
