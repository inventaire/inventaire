import 'should'
import { createGroup } from '#fixtures/groups'
import { createUser } from '#fixtures/users'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq, authReqC } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/groups?action=refuse-request'

describe('groups:update:refuse-request', () => {
  it('should reject without a group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should remove user from requested list', async () => {
    const [ group, requester ] = await Promise.all([
      createGroup(),
      createUser(),
    ])
    const { _id: requesterId } = requester
    await customAuthReq(requester, 'put', '/api/groups?action=request', { group: group._id })
    await authReq('put', endpoint, { user: requesterId, group: group._id })
    const updatedGroup = await getGroup(group)
    updatedGroup.requested.length.should.equal(0)
  })

  it('reject if not admin user', async () => {
    const group = await createGroup()
    await authReqC('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('user is not admin')
      err.statusCode.should.equal(403)
    })
  })
})
