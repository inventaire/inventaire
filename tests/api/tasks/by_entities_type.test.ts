import 'should'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createTask } from '../fixtures/tasks.js'
import { getByEntitiesType } from '../utils/tasks.js'
import { publicReq } from '../utils/utils.js'

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
