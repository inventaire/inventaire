import 'should'
import { createHuman, someFakeUri, createWorkWithAuthor } from '../fixtures/entities.js'
import { createTask } from '../fixtures/tasks.js'
import {
  getByIds,
  getByScore,
  getBySuspectUris,
  getBySuggestionUris,
  getByEntitiesType,
  update,
} from '../utils/tasks.js'

// Tests dependency: having a populated Elasticsearch wikidata index

describe('tasks:byIds', () => {
  it('should return tasks by ids', async () => {
    const { id: taskId } = await createTask()
    const [ task ] = await getByIds(taskId)
    task._id.should.equal(taskId)
  })

  it('should return wikipedia article context', async () => {
    const suspect = await createHuman({ labels: { en: 'Victor Heymes' } })

    // wpArticleUrl page should contain workLabel
    const workLabel = 'Walscheid'
    const wpArticleUrl = 'https://fr.wikipedia.org/wiki/Victor_Michel_Heym%C3%A8s'

    await createWorkWithAuthor({ uri: suspect.uri }, workLabel)
    const res = await createTask({
      suspectUri: suspect.uri,
      suggestionUri: 'wd:Q1562503', // Victor Michel Heymès
      externalSourcesOccurrences: [
        {
          url: wpArticleUrl,
          matchedTitles: [ 'Walscheid' ],
          structuredDataSource: false,
        },
      ],
    })
    const [ task ] = await getByIds(res.id)
    const lowercasedLabel = workLabel.toLowerCase()
    task.externalSourcesOccurrences[0].contexts[0].should.containEql(lowercasedLabel)
  })
})

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

describe('tasks:byEntitiesType', () => {
  const entitiesType = 'work'

  it('should return tasks with a specific entitiesType', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type: entitiesType })
    tasks[0].entitiesType.should.equal(entitiesType)
  })

  it('should return a limited array of tasks', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type: entitiesType, limit: 1 })
    tasks.length.should.equal(1)
  })

  it('should take an offset parameter', async () => {
    await createTask({ entitiesType })
    const tasksA = await getByEntitiesType({ type: entitiesType })
    const tasksB = await getByEntitiesType({ type: entitiesType, offset: 1 })
    tasksA[1].should.deepEqual(tasksB[0])
  })

  it('should return old task before newer ones', async () => {
    await createTask({ entitiesType })
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type: entitiesType })
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
