import 'should'
import { publicReq } from '#tests/api/utils/utils'
import { createHuman, someFakeUri } from '../fixtures/entities.js'
import { createTask } from '../fixtures/tasks.js'
import {
  endpoint,
  getBySuspectUris,
  getBySuggestionUris,
  update,
} from '../utils/tasks.js'

describe('tasks:bySuspectUris', () => {
  it('should return an array of tasks', async () => {
    const suspect = await createHuman()
    await createTask({ suspectUri: suspect.uri })
    const { uri } = suspect
    const tasks = await getBySuspectUris(uri)
    tasks.should.be.an.Object()
    Object.keys(tasks).length.should.equal(1)
    tasks[uri].should.be.an.Array()
    tasks[uri][0].should.be.an.Object()
  })

  it('with empty type should return an array of tasks', async () => {
    const suspect = await createHuman()
    await createTask({ suspectUri: suspect.uri })
    const { uri } = suspect
    const { tasks } = await publicReq('get', `${endpoint}by-suspect-uris&uris=${uri}`)
    tasks[uri][0].should.be.an.Object()
  })

  it('should not return archived tasks', async () => {
    const suspect = await createHuman()
    const { uri } = suspect
    const task = await createTask({ uri })
    await update(task._id, 'state', 'dismissed')
    const tasks = await getBySuspectUris(uri)
    tasks[uri].length.should.equal(0)
  })

  it('should return an array of tasks even when no tasks is found', async () => {
    const tasks = await getBySuspectUris(someFakeUri)
    tasks.should.be.an.Object()
    Object.keys(tasks).length.should.equal(1)
    tasks[someFakeUri].should.be.an.Array()
    tasks[someFakeUri].length.should.equal(0)
  })
})

describe('tasks:bySuggestionUris', () => {
  it('should return tasks', async () => {
    const suggestion = await createHuman()
    const { uri } = suggestion
    await createTask({ suggestionUri: uri })
    const tasks = await getBySuggestionUris(uri)
    tasks.should.be.an.Object()
    Object.keys(tasks).length.should.equal(1)
    tasks[uri].should.be.an.Array()
    tasks[uri][0].should.be.an.Object()
  })

  it('should return an array of tasks even when no tasks is found', async () => {
    const uri = 'wd:Q32193244'
    const tasks = await getBySuggestionUris(uri)
    tasks.should.be.an.Object()
    Object.keys(tasks).length.should.equal(1)
    tasks[uri].should.be.an.Array()
    tasks[uri].length.should.equal(0)
  })
})
