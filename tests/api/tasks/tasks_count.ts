import 'should'
import { createTask } from '#fixtures/tasks'
import { tasksCount } from '#tests/api/utils/tasks'

describe('tasks:byScore', () => {
  it('should return tasks count per type', async () => {
    await createTask()
    const count = await tasksCount({})
    count.human.should.be.aboveOrEqual(1)
  })
})
