import should from 'should'
import { createUser } from '#fixtures/users'
import { getDeanonymizedUser, publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/users?action=by-anonymizable-ids'

describe('users:by-anonymizable-ids', () => {
  it('should reject without id', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get an anonymized user without their public data', async () => {
    const user = await createUser()
    const { anonymizableId: userAnonymizableId } = user
    const res = await publicReq('get', `${endpoint}&ids=${userAnonymizableId}`)
    const foundUser = res.users[userAnonymizableId]
    foundUser.should.deepEqual({
      anonymizableId: userAnonymizableId,
      settings: {
        contributions: {
          anonymize: true,
        },
      },
    })
  })

  it('should get a deanonymized user public data', async () => {
    const user = await getDeanonymizedUser()
    const { anonymizableId: userAnonymizableId } = user
    const res = await publicReq('get', `${endpoint}&ids=${userAnonymizableId}`)
    const foundUser = res.users[userAnonymizableId]
    foundUser.anonymizableId.should.equal(userAnonymizableId)
    foundUser.username.should.equal(user.username)
    should(foundUser.bio).equal(user.bio)
    foundUser.settings.should.deepEqual({
      contributions: {
        anonymize: false,
      },
    })
  })
})