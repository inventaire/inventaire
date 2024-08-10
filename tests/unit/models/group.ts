import 'should'
import { wait } from '#lib/promises'
import { createGroupDoc, groupMembershipActions, removeUserFromGroupDoc } from '#models/group'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const someUserId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const someOtherUserId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'
const someOtherUserId2 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaac'

const createSomeGroup = () => {
  return createGroupDoc({
    name: 'a',
    description: '',
    searchable: false,
    position: null,
    creatorId: someUserId,
    open: false,
  })
}

describe('group model', () => {
  describe('create', () => {
    it('should reject without creatorId', () => {
      try {
        const doc = createGroupDoc({ name: 'a', description: '', searchable: false, position: null })
        shouldNotBeCalled(doc)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.equal('invalid creatorId: undefined')
      }
    })

    it('should generate a group document', () => {
      const group = createSomeGroup()
      group.admins.should.be.an.Array()
      group.admins[0].user.should.equal(someUserId)
      group.members.should.deepEqual([])
      group.invited.should.deepEqual([])
      group.declined.should.deepEqual([])
      group.requested.should.deepEqual([])
    })

    it('should create an open group', () => {
      const doc = createGroupDoc({
        name: 'a',
        creatorId: someUserId,
        description: '',
        searchable: false,
        position: null,
        open: true,
      })
      doc.open.should.be.true()
    })

    it('should reject a too long name', () => {
      try {
        const name = 'hello'.repeat(100)
        const doc = createGroupDoc({ name, creatorId: someUserId })
        shouldNotBeCalled(doc)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.startWith('invalid name')
      }
    })

    it('should reject a name that could be a CouchDB uuid', () => {
      try {
        const doc = createGroupDoc({ name: someUserId })
        shouldNotBeCalled(doc)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.startWith('invalid name')
      }
    })

    it('should reject a slug that could be a CouchDB uuid', () => {
      try {
        const doc = createGroupDoc({ name: `  ${someUserId} -$` })
        shouldNotBeCalled(doc)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.startWith('invalid name')
      }
    })
  })

  describe('invite', () => {
    it('should invite a user', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      group.invited[0].user.should.equal(someOtherUserId)
    })
  })

  describe('accept', () => {
    it('should accept an invitation', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      group.invited.length.should.equal(0)
      group.members[0].user.should.equal(someOtherUserId)
    })
  })

  describe('decline', () => {
    it('should decline an invitation', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.decline(someOtherUserId, null, group)
      group.invited.length.should.equal(0)
      group.declined[0].user.should.equal(someOtherUserId)
    })
  })

  describe('request', () => {
    it('should add a request to join', () => {
      const group = createSomeGroup()
      groupMembershipActions.request(someOtherUserId, null, group)
      group.requested[0].user.should.equal(someOtherUserId)
    })
  })

  describe('cancelRequest', () => {
    it('should cancel a request to join', () => {
      const group = createSomeGroup()
      groupMembershipActions.request(someOtherUserId, null, group)
      groupMembershipActions.cancelRequest(someOtherUserId, null, group)
      group.requested.length.should.equal(0)
    })
  })

  describe('acceptRequest', () => {
    it('should accept a request to join', () => {
      const group = createSomeGroup()
      groupMembershipActions.request(someOtherUserId, null, group)
      groupMembershipActions.acceptRequest(someUserId, someOtherUserId, group)
      group.requested.length.should.equal(0)
      group.members[0].user.should.equal(someOtherUserId)
    })
  })

  describe('refuseRequest', () => {
    it('should refuse a request to join', () => {
      const group = createSomeGroup()
      groupMembershipActions.request(someOtherUserId, null, group)
      groupMembershipActions.refuseRequest(someUserId, someOtherUserId, group)
      group.requested.length.should.equal(0)
    })
  })

  describe('makeAdmin', () => {
    it('should make a user admin', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      groupMembershipActions.makeAdmin(someUserId, someOtherUserId, group)
      group.members.length.should.equal(0)
      group.admins[1].user.should.equal(someOtherUserId)
    })
  })

  describe('kick', () => {
    it('should kick a user from group', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      groupMembershipActions.kick(someUserId, someOtherUserId, group)
      group.members.length.should.equal(0)
    })
  })

  describe('leave', () => {
    it('should leave a group', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      groupMembershipActions.leave(someOtherUserId, null, group)
      group.members.length.should.equal(0)
    })
  })

  describe('delete user', () => {
    it('should delete a member', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      removeUserFromGroupDoc(group, someOtherUserId)
      group.members.length.should.equal(0)
    })

    it('should delete an invited user', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      removeUserFromGroupDoc(group, someOtherUserId)
      group.invited.length.should.equal(0)
    })

    it('should delete a requesting user', () => {
      const group = createSomeGroup()
      groupMembershipActions.request(someOtherUserId, null, group)
      removeUserFromGroupDoc(group, someOtherUserId)
      group.requested.length.should.equal(0)
    })

    it('should delete an admin when there are other admins', () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      groupMembershipActions.makeAdmin(someUserId, someOtherUserId, group)
      removeUserFromGroupDoc(group, someOtherUserId)
      group.admins.length.should.equal(1)
      group.admins[0].user.should.equal(someUserId)
    })

    it('should delete an admin and pass admin role when there are other members', async () => {
      const group = createSomeGroup()
      groupMembershipActions.invite(someUserId, someOtherUserId, group)
      groupMembershipActions.accept(someOtherUserId, null, group)
      // Wait so that the second user is added with a different timestamp
      await wait(10)
      groupMembershipActions.invite(someUserId, someOtherUserId2, group)
      groupMembershipActions.accept(someOtherUserId2, null, group)
      removeUserFromGroupDoc(group, someUserId)
      group.admins.length.should.equal(2)
      group.admins[0].user.should.equal(someOtherUserId)
      group.admins[1].user.should.equal(someOtherUserId2)
      group.members.length.should.equal(0)
    })
  })
})
