import should from 'should'
import { createHuman } from '#fixtures/entities'
import { createTask } from '#fixtures/tasks'
import { wait } from '#lib/promises'
import { federatedMode } from '#server/config'
import { merge, revertMerge, deleteByUris as deleteEntityByUris, findOrIndexEntities } from '#tests/api/utils/entities'
import { getByIds, getBySuspectUri, update } from '#tests/api/utils/tasks'
import type { EntityUri } from '#types/entity'

const hookDelay = 300

describe('tasks:hooks', () => {
  before(function () { if (federatedMode) this.skip() })

  describe('entity merge', () => {
    before(async () => {
      // Tests dependency: having a populated ElasticSearch wikidata index
      const wikidataUris: EntityUri[] = [
        'wd:Q29169693', // Mai Thi Nguyen-Kim
        'wd:Q106730482', // Mai Thi Nguyen
        'wd:Q237087', // Fred Vargas
      ]
      await findOrIndexEntities(wikidataUris)
    })

    it('should update same suspect tasks to processed state ', async () => {
      const { uri: suspectUri } = await createHuman({ labels: { en: 'Mai Thi Nguyen' } })
      await createTask({
        suspectUri,
        suggestionUri: 'wd:Q29169693',
      })
      const otherTask = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q106730482',
      })
      await merge(suspectUri, 'wd:Q29169693')
      await wait(hookDelay)
      const [ updatedTask ] = await getByIds(otherTask._id)
      updatedTask.state.should.equal('processed')
    })

    it('should update task state to processed', async () => {
      const [ suspect, suggestion ] = await Promise.all([ createHuman(), createHuman() ])
      const taskParams = {
        suspectUri: suspect.uri,
        suggestionUri: suggestion.uri,
      }
      const task = await createTask(taskParams)
      await merge(suspect.uri, suggestion.uri)
      await wait(hookDelay)
      const [ updatedTask ] = await getByIds(task._id)
      updatedTask.state.should.equal('processed')
    })
  })

  describe('task update', () => {
    it('should update relationScore of tasks with same suspect', async () => {
      const { uri: suspectUri } = await createHuman({ labels: { en: 'Mai Thi Nguyen' } })
      const taskToUpdate = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q29169693',
      })
      const { _id: otherTaskId } = await createTask({
        suspectUri,
        suggestionUri: 'wd:Q106730482',
      })
      const [ otherTask ] = await getByIds(otherTaskId)
      const { relationScore: otherTaskRelationScore } = otherTask
      await update(taskToUpdate._id, 'state', 'dismissed')
      await wait(hookDelay)
      const [ updatedTask ] = await getByIds(otherTask._id)
      updatedTask.relationScore.should.not.equal(otherTaskRelationScore)
    })
  })

  describe('entity merge revert', () => {
    it('should revert task state', async () => {
      const { uri } = await createHuman({ labels: { en: 'Fred Vargas' } })
      const { _id: otherTaskId } = await createTask({
        suspectUri: uri,
        suggestionUri: 'wd:Q106730482',
      })
      const [ task ] = await getByIds(otherTaskId)
      await merge(task.suspectUri, task.suggestionUri)
      await wait(hookDelay)
      const [ refreshedTask ] = await getByIds(task._id)
      refreshedTask.state.should.equal('processed')
      await revertMerge(refreshedTask.suspectUri)
      await wait(150)
      const [ rerefreshedTask ] = await getByIds(task._id)
      should(rerefreshedTask.state).not.be.ok()
    })
  })

  describe('entity removed', () => {
    it('should update tasks to processed state when the entity is deleted', async () => {
      const suspect = await createHuman()
      await createTask({ suspectUri: suspect.uri })
      await deleteEntityByUris([ suspect.uri ])
      const tasks = await getBySuspectUri(suspect.uri)
      tasks.length.should.equal(0)
    })
  })
})
