import { createHuman, createWorkWithAuthor, randomLabel, createHuman } from '#tests/api/fixtures/entities'
import { getByUris, merge } from '#tests/api/utils/entities'
import { getBySuspectUri } from '#tests/api/utils/tasks'
import { publicReq, getUser } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

async function userMerge (fromUri, toUri) {
  return merge(fromUri, toUri, { user: getUser() })
}

describe('entities:merge', () => {
  it('should reject not logged requests', async () => {
    await publicReq('put', '/api/entities?action=merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should merge when inv works labels match', async () => {
    const humanLabel = randomLabel()
    const workLabel = randomLabel()
    const human = await createHuman({ labels: { en: humanLabel } })
    const human2 = await createHuman({ labels: { en: humanLabel } })
    await Promise.all([
      createWorkWithAuthor(human2, workLabel),
      createWorkWithAuthor(human, workLabel),
    ])
    await userMerge(human.uri, human2.uri)
    const { entities } = await getByUris(human.uri)
    entities[human2.uri].should.be.ok()
  })

  it('should create a task when no works labels match', async () => {
    const humanLabel = randomLabel()
    const workLabel = randomLabel()
    const workLabel2 = randomLabel()
    const human = await createHuman({ labels: { en: humanLabel } })
    const human2 = await createHuman({ labels: { en: humanLabel } })
    await Promise.all([
      createWorkWithAuthor(human, workLabel),
      createWorkWithAuthor(human2, workLabel2),
    ])
    await userMerge(human.uri, human2.uri)
    const tasks = await getBySuspectUri(human.uri)
    tasks.length.should.aboveOrEqual(1)
    const user = await getUser()
    tasks[0].reporter.should.equal(user._id)
  })
})
