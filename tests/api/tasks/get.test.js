require('should')
const { createHuman, someFakeUri } = require('../fixtures/entities')
const { getByScore, getBySuspectUris, getBySuggestionUris, getByType, update } = require('../utils/tasks')
const { createTask } = require('../fixtures/tasks')

// Tests dependency: having a populated Elasticsearch wikidata index
describe('tasks:byScore', () => {
  it('should return 10 or less tasks by default', async () => {
    await createTask()
    const tasks = await getByScore()
    tasks.length.should.be.belowOrEqual(10)
    tasks.length.should.be.aboveOrEqual(1)
  })

  it('should return a limited array of tasks', async () => {
    await createTask()
    const tasks = await getByScore({ limit: 1 })
    tasks.length.should.equal(1)
  })

  it('should take an offset parameter', async () => {
    await createTask()
    const tasksA = await getByScore()
    const tasksB = await getByScore({ offset: 1 })
    tasksA[1].should.deepEqual(tasksB[0])
  })
})

describe('tasks:byType', () => {
  const type = 'userReport'

  it('should return tasks with a specific type', async () => {
    await createTask({ type })
    const tasks = await getByType({ type })
    tasks[0].type.should.equal(type)
  })

  it('should return a limited array of tasks', async () => {
    await createTask({ type })
    const tasks = await getByType({ type, limit: 1 })
    tasks.length.should.equal(1)
  })

  it('should take an offset parameter', async () => {
    await createTask({ type })
    const tasksA = await getByType({ type })
    const tasksB = await getByType({ type, offset: 1 })
    tasksA[1].should.deepEqual(tasksB[0])
  })

  it('should return old task before newer ones', async () => {
    await createTask({ type })
    await createTask({ type })
    const tasks = await getByType({ type })
    tasks[0].created.should.below(tasks[1].created)
  })
})

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

  it('should not return archived tasks', async () => {
    const suspect = await createHuman()
    const { uri } = suspect
    const task = await createTask({ uri })
    await update(task.id, 'state', 'dismissed')
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
