import 'should'
import { map } from 'lodash-es'
import { getSomeGroup, createGroup } from '#fixtures/groups'
import { humanName } from '#fixtures/text'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq, authReqC, getUserGetter } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/groups?action=accept-request'

describe('groups:update:accept-request', () => {
  it('should reject without a group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should move requested user to members', async () => {
    const requesterPromise = getUserGetter(humanName())()
    const [ group, requester ] = await Promise.all([ getSomeGroup(), requesterPromise ])
    const { _id: requesterId } = requester
    await customAuthReq(requesterPromise, 'put', '/api/groups?action=request', { group: group._id })
    await authReq('put', endpoint, { user: requesterId, group: group._id })
    const updatedGroup = await getGroup(group)
    map(updatedGroup.members, 'user').should.containEql(requesterId)
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
