import 'should'
import { getGroup } from '#tests/api/utils/groups'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { authReq, authReqC, customAuthReq, getReservedUser } from '../utils/utils.js'
import { getSomeGroup } from '../fixtures/groups.js'

const endpoint = '/api/groups?action=cancel-request'

describe('groups:update:cancel-request', () => {
  it('should reject without group', async () => {
    await authReq('put', endpoint, {})
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('missing parameter in body: group')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject when no request exists for user', async () => {
    const group = await getSomeGroup()
    await authReqC('put', endpoint, { group: group._id })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('request not found')
      err.statusCode.should.equal(403)
    })
  })

  it('should cancel a request', async () => {
    const [ group, requester ] = await Promise.all([ getSomeGroup(), getReservedUser() ])
    await customAuthReq(requester, 'put', '/api/groups?action=request', { group: group._id })
    const updatedGroup = await getGroup(group)
    const requesterCount = updatedGroup.requested.length
    await customAuthReq(requester, 'put', endpoint, { group: updatedGroup._id })
    const reupdatedGroup = await getGroup(updatedGroup)
    reupdatedGroup.requested.length.should.equal(requesterCount - 1)
  })
})
