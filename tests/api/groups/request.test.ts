import 'should'
import { getSomeGroup, createGroup, addInvited, addDeclined } from '#fixtures/groups'
import { createUser } from '#fixtures/users'
import { getGroup } from '#tests/api/utils/groups'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/groups?action=request'

describe('groups:update:request', () => {
  it('should reject without group', async () => {
    try {
      await authReq('put', endpoint, { user: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: group')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject request from already member users', async () => {
    try {
      const group = await getSomeGroup()
      const userPromise = createUser()
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id })
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('user is already in group')
      err.statusCode.should.equal(403)
    }
  })

  it('should add user to requesters list', async () => {
    const group = await createGroup()
    const user = await createUser()
    await customAuthReq(user, 'put', endpoint, { group: group._id })
    const resGroup = await getGroup(group)
    resGroup.requested.at(-1).user.should.equal(user._id)
  })

  it('should add user to members list after they where invited but declined, and now request to join', async () => {
    const group = await createGroup()
    const user = await createUser()
    await addDeclined(group, user)
    await customAuthReq(user, 'put', endpoint, { group: group._id })
    const resGroup = await getGroup(group)
    resGroup.members.at(-1).user.should.equal(user._id)
  })

  it('should add user to members list if already invited', async () => {
    const group = await createGroup()
    const user = await createUser()
    await addInvited(group, user)
    await customAuthReq(user, 'put', endpoint, { group: group._id })
    const resGroup = await getGroup(group)
    resGroup.members.at(-1).user.should.equal(user._id)
  })

  describe('when group is open', () => {
    it('should directly add user to members', async () => {
      const group = await createGroup()
      await authReq('put', '/api/groups?action=update-settings', {
        group: group._id,
        attribute: 'open',
        value: true,
      })
      const membersCount = group.members.length
      const requestedCount = group.requested.length
      const userPromise = createUser()
      await customAuthReq(userPromise, 'put', endpoint, { group: group._id })
      const resGroup = await getGroup(group)
      resGroup.members.length.should.equal(membersCount + 1)
      resGroup.requested.length.should.equal(requestedCount)
    })
  })
})
