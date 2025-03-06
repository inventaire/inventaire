import 'should'
import { createHuman } from '#fixtures/entities'
import { createTask } from '#fixtures/tasks'
import { federatedMode } from '#server/config'
import { update, endpoint } from '#tests/api/utils/tasks'
import { dataadminReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

describe('tasks:update', () => {
  it('should update a task', async function () {
    // Disabled in federated mode as this test directly mutates the local tasks database
    if (federatedMode) this.skip()
    const suspect = await createHuman()
    const task = await createTask({ suspectUri: suspect.uri })
    const { ok } = await update(task._id, 'state', 'dismissed')
    ok.should.be.true()
  })

  it('should update a task as dataadmin', async function () {
    // Disabled in federated mode as this test directly mutates the local tasks database
    if (federatedMode) this.skip()
    const suspect = await createHuman()
    const task = await createTask({ suspectUri: suspect.uri })

    const { ok } = await dataadminReq('put', `${endpoint}update`, {
      id: task._id,
      attribute: 'state',
      value: 'dismissed',
    })
    ok.should.be.true()
  })

  it('should throw if invalid task id', async function () {
    // Disabled in federated mode yet as this test relies on a special role
    if (federatedMode) this.skip()
    await update('')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.be.a.String()
    })
  })
})
