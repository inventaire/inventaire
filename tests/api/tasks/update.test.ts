import 'should'
import { createHuman } from '#fixtures/entities'
import { createTask } from '#fixtures/tasks'
import { update } from '#tests/api/utils/tasks'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('tasks:update', () => {
  it('should update a task', async () => {
    const suspect = await createHuman()
    const task = await createTask({ suspectUri: suspect.uri })
    const { ok } = await update(task._id, 'state', 'dismissed')
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
