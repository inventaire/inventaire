import 'should'
import { createTask } from '#fixtures/tasks'
import { getByEntitiesType } from '#tests/api/utils/tasks'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import type { Url } from '#types/common'

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
    const url: Url = `/api/tasks?action=by-entities-type&type=${type}`
    return publicReq('get', url)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: entities-type')
    })
  })

  it('should return tasks with a specific entities type', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type, entitiesType })
    tasks[0].type.should.equal(type)
    tasks[0].entitiesType.should.equal(entitiesType)
  })

  it('should return a limited array of tasks', async () => {
    await createTask({ entitiesType })
    const tasks = await getByEntitiesType({ type, entitiesType, limit: 1 })
    tasks.length.should.equal(1)
  })

  it('should take an offset parameter', async () => {
    await createTask({ entitiesType })
    const tasksA = await getByEntitiesType({ type, entitiesType, limit: 2 })
    const tasksB = await getByEntitiesType({ type, entitiesType, offset: 1 })
    tasksA[1].should.deepEqual(tasksB[0])
  })
})
