import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createHuman, someFakeUri } from '../fixtures/entities.js'
import { createTask } from '../fixtures/tasks.js'
import {
  getByScore,
  getBySuspectUris,
  getBySuggestionUris,
  getByEntitiesType,
  update,
} from '../utils/tasks.js'
import { publicReq } from '../utils/utils.js'

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

describe('tasks:byEntitiesType', () => {
  const entitiesType = 'work'
  const type = 'deduplicate'

  it('should reject requests without task type', async () => {
    await createTask({ entitiesType })
    const url = '/api/tasks?action=by-entities-type'
    return publicReq('get', url)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: type')
    })
  })

  it('should reject requests without entities type', async () => {
    await createTask({ entitiesType })
    const url = `/api/tasks?action=by-entities-type&type=${type}`
    return publicReq('get', url)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: entities-type')
    })
  })

  it('should return tasks with a specific entities type', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type, entitiesType })
    tasks[0].entitiesType.should.equal(entitiesType)
  })

  it('should return a limited array of tasks', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type, entitiesType, limit: 1 })
    tasks.length.should.equal(1)
  })

  it('should take an offset parameter', async () => {
    await createTask({ entitiesType })
    const tasksA = await getByEntitiesType({ type, entitiesType })
    const tasksB = await getByEntitiesType({ type, entitiesType, offset: 1 })
    tasksA[1].should.deepEqual(tasksB[0])
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
