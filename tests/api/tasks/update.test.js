import 'should'
import { createHuman } from '../fixtures/entities'
import { update } from '../utils/tasks'
import { createTask } from '../fixtures/tasks'
import { shouldNotBeCalled } from 'tests/unit/utils'

describe('tasks:update', () => {
  it('should update a task', async () => {
    const suspect = await createHuman()
    const task = await createTask({ suspectUri: suspect.uri })
    const { ok } = await update(task.id, 'state', 'dismissed')
    ok.should.be.true()
  })

  it('should throw if invalid task id', async () => {
    await update('')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.be.a.String()
    })
  })
})
