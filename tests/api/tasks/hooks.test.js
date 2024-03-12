import should from 'should'
import { wait } from '#lib/promises'
import { createHuman } from '../fixtures/entities.js'
import { createTask } from '../fixtures/tasks.js'
import { merge, revertMerge, deleteByUris as deleteEntityByUris, findOrIndexEntities } from '../utils/entities.js'
import { getByIds, getBySuspectUri, update, checkEntities } from '../utils/tasks.js'

describe('tasks:hooks', () => {
  describe('entity merge', () => {
    before(async () => {
      // Tests dependency: having a populated ElasticSearch wikidata index
      const wikidataUris = [
        'wd:Q535', 'wd:Q15339037', // some Victor Hugos
        'wd:Q237087', // Fred Vargas
      ]
      await findOrIndexEntities(wikidataUris)
    })

    it('should update same suspect tasks to merged state ', async () => {
      const { uri: suspectUri } = await createHuman({ labels: { en: 'Victor Hugo' } })
      await createTask({
        suspectUri,
        suggestionUri: 'wd:Q535',
      })
      const otherTask = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q15339037',
      })
      await merge(suspectUri, 'wd:Q535')
      await wait(150)
      const [ updatedTask ] = await getByIds(otherTask._id)
      updatedTask.state.should.equal('merged')
    })

    it('should update task state to merged', async () => {
      const [ suspect, suggestion ] = await Promise.all([ createHuman(), createHuman() ])
      const taskParams = {
        suspectUri: suspect.uri,
        suggestionUri: suggestion.uri,
      }
      const task = await createTask(taskParams)
      await merge(suspect.uri, suggestion.uri)
      await wait(150)
      const [ updatedTask ] = await getByIds(task._id)
      updatedTask.state.should.equal('merged')
    })
  })

  describe('task update', () => {
    it('should update relationScore of tasks with same suspect', async () => {
      const { uri: suspectUri } = await createHuman({ labels: { en: 'Victor Hugo' } })
      const taskToUpdate = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q535',
      })
      const { _id: otherTaskId } = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q15339037',
      })
      const [ otherTask ] = await getByIds(otherTaskId)
      const { relationScore: otherTaskRelationScore } = otherTask
      await update(taskToUpdate._id, 'state', 'dismissed')
      await wait(150)
      const [ updatedTask ] = await getByIds(otherTask._id)
      updatedTask.relationScore.should.not.equal(otherTaskRelationScore)
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
      await wait(150)
      const [ rerefreshedTask ] = await getByIds(task._id)
      should(rerefreshedTask.state).not.be.ok()
    })
  })

  describe('entity removed', () => {
    it('should update tasks to merged state when the entity is deleted', async () => {
      const suspect = await createHuman()
      await createTask({ suspectUri: suspect.uri })
      await deleteEntityByUris(suspect.uri)
      const tasks = await getBySuspectUri(suspect.uri)
      tasks.length.should.equal(0)
    })
  })
})
