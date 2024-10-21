import 'should'
import { createTask } from '#fixtures/tasks'
import { tasksCount } from '#tests/api/utils/tasks'

describe('tasks:count', () => {
  it('should return tasks count per type', async () => {
    await createTask({
      type: 'deduplicate',
      entitiesType: 'human',
      reporter: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    })
    const count = await tasksCount()
    count.deduplicate.human.should.be.aboveOrEqual(1)
  })
})
