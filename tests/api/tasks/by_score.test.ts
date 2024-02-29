import 'should'
import { createTask } from '../fixtures/tasks.js'
import { getByScore } from '../utils/tasks.js'

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
